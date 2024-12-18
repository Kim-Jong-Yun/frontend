import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import axios from 'axios';

function MapComponent({ robots, mapUrl, mapId }) {
  const canvasRef = useRef(null);
  const mapImageRef = useRef(null);
  const robotRefs = useRef([]);
  const [nodes, setNodes] = useState([]);
  const [noGoZones, setNoGoZones] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  const mapResolution = 0.05;
  const mapOrigin = [-10.0, -10.0];

  // 서버에서 노드와 연결 정보 가져오기
  const fetchNodes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('토큰이 없습니다. 다시 로그인해주세요.');
        window.location.href = '/login';
        return;
      }

      const response = await axios.get(`http://3.39.166.207:5557/map/nodes/${mapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNodes(response.data);
    } catch (error) {
      console.error('노드 정보를 가져오는 중 오류 발생:', error);
    }
  };

  // 서버에서 금지 구역 정보 가져오기
  const fetchNoGoZones = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await axios.get(`http://3.39.166.207:5557/map/no-go-zones/map/${mapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNoGoZones(response.data);
    } catch (error) {
      console.error('금지구역을 가져오는 중 오류 발생:', error);
    }
  };

  // 지도 이미지를 로드하고 그리는 함수
  const loadMapImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    mapImageRef.current = new Image();
    mapImageRef.current.src = mapUrl;

    mapImageRef.current.onload = () => {
      const containerWidth = canvas.parentElement.clientWidth;
      const containerHeight = canvas.parentElement.clientHeight;
      const imgWidth = mapImageRef.current.width;
      const imgHeight = mapImageRef.current.height;
      const imgAspectRatio = imgWidth / imgHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let drawWidth, drawHeight;

      if (imgAspectRatio > containerAspectRatio) {
        drawWidth = containerWidth;
        drawHeight = containerWidth / imgAspectRatio;
      } else {
        drawHeight = containerHeight;
        drawWidth = containerHeight * imgAspectRatio;
      }

      canvas.width = drawWidth;
      canvas.height = drawHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mapImageRef.current, 0, 0, drawWidth, drawHeight);

      drawMapElements(); // 모든 요소 그리기 (노드, 연결선, 금지 구역, 로봇 등)
    };
  };

  // 노드 간 연결선, 금지 구역, 노드, 로봇 위치를 그리는 함수
  const drawMapElements = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!canvas || !mapImageRef.current) return;

    // 지도 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);

    // 금지 구역 그리기
    noGoZones.forEach((zone) => {
      const topLeft = worldToMap(zone.topLeft.x, zone.topLeft.y);
      const bottomRight = worldToMap(zone.bottomRight.x, zone.bottomRight.y);
      const width = bottomRight.mapX - topLeft.mapX;
      const height = bottomRight.mapY - topLeft.mapY;

      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(topLeft.mapX, topLeft.mapY, width, height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(topLeft.mapX, topLeft.mapY, width, height);
    });

    // 노드 간 연결선 그리기 (웨이포인트 포함)
    nodes.forEach((node) => {
      node.connections.forEach((connection) => {
        const connectedNode = nodes.find((n) => n._id === connection.node);
        if (connectedNode) {
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.beginPath();

          const { mapX: startX, mapY: startY } = worldToMap(node.x, node.y);
          ctx.moveTo(startX, startY);

          // 각 웨이포인트를 연결하며 그리기
          if (connection.waypoints && connection.waypoints.length > 0) {
            connection.waypoints.forEach((waypoint) => {
              const { mapX, mapY } = worldToMap(waypoint.x, waypoint.y);
              ctx.lineTo(mapX, mapY);
            });
          }

          // 마지막에 연결된 노드까지 연결
          const { mapX: endX, mapY: endY } = worldToMap(connectedNode.x, connectedNode.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    });

    // 노드와 로봇 그리기
    drawNodes();
    drawRobots();
  };

  // 노드 그리기 함수
  const drawNodes = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    nodes.forEach((node) => {
      const { x, y, name } = node;
      const { mapX, mapY } = worldToMap(x, y);

      const size = 10;
      ctx.fillStyle = 'red';
      ctx.fillRect(mapX - size / 2, mapY - size / 2, size, size);

      if (hoveredNode && hoveredNode._id === node._id) {
        const textPadding = 4;
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(name).width;
        const backgroundWidth = textWidth + textPadding * 2;
        const backgroundHeight = 16;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(
          mapX + size / 2,
          mapY - size / 2 - backgroundHeight,
          backgroundWidth,
          backgroundHeight
        );

        ctx.fillStyle = 'white';
        ctx.fillText(name, mapX + size / 2 + textPadding, mapY - size / 2 - textPadding);
      }
    });
  };

  // 로봇 그리기 함수
  const drawRobots = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    robots.forEach((robot, index) => {
      const { x, y } = robot.location;
      const { mapX, mapY } = worldToMap(x, y);

      let robotColor = 'gray';
      if (robot.status?.state === 'Tasking') {
        robotColor = 'blue';
      } else if (robot.status?.state === 'Waiting') {
        robotColor = 'yellow';
      } else if (robot.status?.state === 'Error') {
        robotColor = 'red';
      }

      if (!robotRefs.current[index]) {
        robotRefs.current[index] = { mapX, mapY, robotColor };
      }

      gsap.to(robotRefs.current[index], {
        mapX,
        mapY,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          ctx.fillStyle = robotRefs.current[index].robotColor;
          ctx.beginPath();
          ctx.arc(robotRefs.current[index].mapX, robotRefs.current[index].mapY, 5, 0, 2 * Math.PI);
          ctx.fill();
        },
      });
    });
  };

  // 월드 좌표를 맵 좌표로 변환하는 함수
  const worldToMap = (x, y) => {
    const mapImage = mapImageRef.current;
    const mapWidth = mapImage.width;
    const mapHeight = mapImage.height;

    const mapX = (x - mapOrigin[0]) / mapResolution;
    const mapY = mapHeight - (y - mapOrigin[1]) / mapResolution;
    return { mapX, mapY };
  };

  // 마우스 이동 시 노드 호버 상태 업데이트
  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let foundNode = null;
    nodes.forEach((node) => {
      const { mapX, mapY } = worldToMap(node.x, node.y);
      const distance = Math.sqrt((mouseX - mapX) ** 2 + (mouseY - mapY) ** 2);

      if (distance < 5) {
        foundNode = node;
      }
    });
    setHoveredNode(foundNode);
  };

  // 지도 및 노드, 금지 구역 초기화
  useEffect(() => {
    if (mapUrl) {
      loadMapImage();
      fetchNodes();
      fetchNoGoZones();
    }
  }, [mapUrl, mapId]);

  useEffect(() => {
    if (mapImageRef.current) {
      drawMapElements();
    }
  }, [robots, nodes, noGoZones, hoveredNode]);

  // 마우스 이벤트 리스너 추가
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [nodes]);

  return (
    <div className="map-canvas-container">
      {mapUrl ? (
        <canvas ref={canvasRef} className="canvas"></canvas>
      ) : (
        <p>지도를 불러오는 중...</p>
      )}
    </div>
  );
}

export default MapComponent;
