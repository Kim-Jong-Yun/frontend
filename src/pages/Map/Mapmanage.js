// src/components/MapManage/Mapmanage.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faLink, faUnlink } from '@fortawesome/free-solid-svg-icons';

import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import './Mapmanage.css';
import { worldToMap, mapToWorld } from '../../utils/coordinateUtils';
import NodeList from './NodeList';
import NodeDisconnect from './NodeDisconnect';
import NodeConnectionPopup from './NodeConnectionPopup';

function Mapmanage() {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isMonitored, setIsMonitored] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [mapFile, setMapFile] = useState(null);
  const [yamlFile, setYamlFile] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [nodeX, setNodeX] = useState(null);
  const [nodeY, setNodeY] = useState(null);
  const [nodeName, setNodeName] = useState('');
  const [isNodePopupOpen, setIsNodePopupOpen] = useState(false);
  const canvasRef = useRef(null);
  const mapImageRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [isDeletingNode, setIsDeletingNode] = useState(false);

  const [imageNaturalWidth, setImageNaturalWidth] = useState(null);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(null);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [isNodeConnectionPopupOpen, setIsNodeConnectionPopupOpen] = useState(false);
  const [connectionData, setConnectionData] = useState({ node1: null, node2: null, waypoints: [] });

  const [disconnectStep, setDisconnectStep] = useState('idle');
  const [disconnectFirstNodeId, setDisconnectFirstNodeId] = useState(null);
  const [disconnectSecondNodeId, setDisconnectSecondNodeId] = useState(null);

  const [isCreatingNoGoZone, setIsCreatingNoGoZone] = useState(false);
  const [isDeletingNoGoZone, setIsDeletingNoGoZone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [noGoZones, setNoGoZones] = useState([]);

  const [isPatchingMap, setIsPatchingMap] = useState(false);
  const [selectionMode, setSelectionMode] = useState('none'); // 'none' | 'selectingNode1' | 'selectingNode2' | 'selectingWaypoint'

  // 커서를 기본 상태로 복구하는 함수
  const resetCursor = () => {
    document.body.style.cursor = 'default';
  };

  // 맵 목록을 서버에서 가져오는 함수
  const fetchMaps = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      const response = await axios.get('http://3.39.166.207:5557/map/maps', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMaps(response.data);

      if (response.data.length > 0) {
        await handleSelectMap(response.data[0]);
      }
    } catch (error) {
      console.error('맵을 가져오는 중 오류 발생:', error);
      alert('맵을 가져오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  // 노드 목록을 서버에서 가져오는 함수
  const fetchNodes = async (mapId) => {
    try {
      const response = await axios.get(`http://3.39.166.207:5557/map/nodes/${mapId}`);
      if (response.status === 200) {
        setNodes(response.data);
      } else {
        setNodes([]);
      }
    } catch (error) {
      console.error('노드를 가져오는 중 오류 발생:', error);
      setNodes([]);
      alert('노드를 가져오는 데 실패했습니다.');
    }
  };

  // 금지구역 목록을 서버에서 가져오는 함수
  const fetchNoGoZones = async (mapId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }
    try {
      const response = await axios.get(`http://3.39.166.207:5557/map/no-go-zones/map/${mapId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNoGoZones(response.data);
    } catch (error) {
      console.error('금지구역을 가져오는 중 오류 발생:', error);
      alert('금지구역을 가져오는 데 실패했습니다.');
    }
  };

  // 맵을 선택했을 때 호출되는 함수
  const handleSelectMap = async (map) => {
    setSelectedMap(map);
    setEditName(map.name);
    setEditDescription(map.description);
    setIsMonitored(map.isMonitored || false);

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://3.39.166.207:5557/map/file/${map._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const imageUrl = URL.createObjectURL(response.data);
      setMapImage(imageUrl);
    } catch (error) {
      console.error('맵 이미지를 가져오는 중 오류 발생:', error);
      alert('맵 이미지를 가져오는 데 실패했습니다.');
    }

    await fetchNoGoZones(map._id);
  };

  // 이미지 로드 시 호출되는 함수 (지도 이미지를 캔버스에 그리기)
  const loadMapImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    mapImageRef.current = new Image();
    mapImageRef.current.src = mapImage;

    mapImageRef.current.onload = () => {
      const imgWidth = mapImageRef.current.width;
      const imgHeight = mapImageRef.current.height;
      setImageNaturalWidth(imgWidth);
      setImageNaturalHeight(imgHeight);

      canvas.width = imgWidth;
      canvas.height = imgHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(mapImageRef.current, 0, 0, imgWidth, imgHeight);
      drawAll();
    };
  };

  // 맵 좌표계를 캔버스 좌표계로 변환하는 함수
  const mapToMapCoordinates = (x, y) => {
    return worldToMap(x, y, imageNaturalWidth, imageNaturalHeight);
  };

  // 캔버스에 모든 요소를 그리는 함수 (지도, 노드, 연결선, 금지구역)
  const drawAll = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!canvas || !imageNaturalWidth || !imageNaturalHeight) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImageRef.current, 0, 0, imageNaturalWidth, imageNaturalHeight);

    // 금지구역 그리기
    noGoZones.forEach((zone) => {
      const topLeft = mapToMapCoordinates(zone.topLeft.x, zone.topLeft.y);
      const bottomRight = mapToMapCoordinates(zone.bottomRight.x, zone.bottomRight.y);
      const width = bottomRight.x - topLeft.x;
      const height = bottomRight.y - topLeft.y;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(topLeft.x, topLeft.y, width, height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(topLeft.x, topLeft.y, width, height);
    });

    // 드래그 중인 사각형 그리기
    if (currentRect) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }

    // 연결선 그리기
    nodes.forEach((node) => {
      node.connections.forEach((connection) => {
        const connectedNode = nodes.find(n => n._id === connection.node);
        if (connectedNode) {
          const { x: startX, y: startY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
          const { x: endX, y: endY } = worldToMap(connectedNode.x, connectedNode.y, imageNaturalWidth, imageNaturalHeight);

          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX, startY);

          if (connection.waypoints && connection.waypoints.length > 0) {
            connection.waypoints.forEach((wp) => {
              const { x: wpX, y: wpY } = worldToMap(wp.x, wp.y, imageNaturalWidth, imageNaturalHeight);
              ctx.lineTo(wpX, wpY);
            });
          }

          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    });

    // 금지구역 삭제 모드일 때, 금지구역 위에 삭제 아이콘 표시
    if (isDeletingNoGoZone) {
      noGoZones.forEach((zone) => {
        const topLeft = mapToMapCoordinates(zone.topLeft.x, zone.topLeft.y);
        const size = 20;
        ctx.fillStyle = 'red';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', topLeft.x + 8, topLeft.y + 15);
      });
    }

    // 노드 그리기
    nodes.forEach((node) => {
      const { x, y } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
      const size = 10;
      ctx.fillStyle = 'red';
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    });
  };

  // 이미지 로드 후 캔버스에 지도 그리기
  useEffect(() => {
    if (mapImage) {
      loadMapImage();
    }
  }, [mapImage]);

  // 맵 이미지와 selectedMap이 모두 설정된 후 노드 및 금지구역 패치
  useEffect(() => {
    if (mapImage && selectedMap) {
      fetchNodes(selectedMap._id);
      fetchNoGoZones(selectedMap._id);
    }
  }, [mapImage, selectedMap]);

  // 노드 또는 금지구역 변경 시마다 캔버스에 다시 그리기
  useEffect(() => {
    if (canvasRef.current && mapImageRef.current) {
      drawAll();
    }
  }, [nodes, noGoZones, currentRect, isDeletingNoGoZone]);

  // 노드 삭제 시 커서 복구
  useEffect(() => {
    if (
      !isDeletingNode &&
      disconnectStep === 'idle' &&
      !isCreatingNoGoZone &&
      !isDeletingNoGoZone &&
      !dragging &&
      selectionMode === 'none'
    ) {
      resetCursor();
    }
  }, [isDeletingNode, disconnectStep, isCreatingNoGoZone, isDeletingNoGoZone, dragging, selectionMode]);

  // 마우스가 캔버스 위를 움직일 때 노드 호버 상태 업데이트
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundNode = null;

    for (let node of nodes) {
      const { x, y } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (distance < 10) { // 반경을 10px로 설정
        foundNode = node;
        break;
      }
    }

    if (foundNode) {
      setHoveredNode(foundNode);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredNode(null);
    }

    // 금지구역 생성 모드일 때 드래그 중인 사각형 업데이트
    if (isCreatingNoGoZone && dragging && dragStart) {
      const newRect = {
        x: Math.min(mouseX, dragStart.x),
        y: Math.min(mouseY, dragStart.y),
        width: Math.abs(mouseX - dragStart.x),
        height: Math.abs(mouseY - dragStart.y),
      };
      setCurrentRect(newRect);
    }
  };

  // 마우스가 캔버스를 벗어났을 때 호버 상태 초기화 및 드래그 상태 초기화
  const handleMouseLeave = () => {
    setHoveredNode(null);
    // 드래그 중이었는데 캔버스를 벗어났을 경우 드래그 취소
    if (isCreatingNoGoZone && dragging) {
      setDragging(false);
      setDragStart(null);
      setCurrentRect(null);
      setIsCreatingNoGoZone(false);
      setSelectionMode('none');
      resetCursor();
    }
  };

  // 드래그 시작 이벤트 핸들러
  const handleMouseDown = (e) => {
    if (isCreatingNoGoZone) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      setDragStart({ x: startX, y: startY });
      setDragging(true);
      document.body.style.cursor = 'crosshair';
    }

    if (isDeletingNoGoZone) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const clickedZone = noGoZones.find(zone => {
        const topLeft = mapToMapCoordinates(zone.topLeft.x, zone.topLeft.y);
        const bottomRight = mapToMapCoordinates(zone.bottomRight.x, zone.bottomRight.y);
        return clickX >= topLeft.x && clickX <= bottomRight.x && clickY >= topLeft.y && clickY <= bottomRight.y;
      });

      if (clickedZone) {
        handleDeleteNoGoZone(clickedZone._id);
      }
    }
  };

  // 드래그 종료 이벤트 핸들러
  const handleMouseUp = async (e) => {
    if (isCreatingNoGoZone && dragging && dragStart && currentRect) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      const finalRect = {
        x: Math.min(endX, dragStart.x),
        y: Math.min(endY, dragStart.y),
        width: Math.abs(endX - dragStart.x),
        height: Math.abs(endY - dragStart.y),
      };

      const topLeftWorld = mapToWorld(finalRect.x, finalRect.y, imageNaturalWidth, imageNaturalHeight);
      const bottomRightWorld = mapToWorld(finalRect.x + finalRect.width, finalRect.y + finalRect.height, imageNaturalWidth, imageNaturalHeight);

      const noGoZone = {
        topLeft: topLeftWorld,
        bottomRight: bottomRightWorld,
        mapId: selectedMap._id,
      };

      const token = localStorage.getItem('token');
      try {
        const response = await axios.post('http://3.39.166.207:5557/map/no-go-zones', noGoZone, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('금지 구역이 성공적으로 생성되었습니다.');
        setNoGoZones([...noGoZones, response.data.noGoZone]);
      } catch (error) {
        console.error('금지 구역 생성 중 오류 발생:', error);
        alert('금지 구역 생성에 실패했습니다.');
      }

      setDragging(false);
      setDragStart(null);
      setCurrentRect(null);
      setIsCreatingNoGoZone(false);
      setSelectionMode('none');
      resetCursor();
      drawAll();
    }
  };

  // 연결 모드 활성화 함수
  const handleConnectNodeMode = () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }
    setIsNodeConnectionPopupOpen(true);
  };

  // 연결 해제 모드 활성화 함수
  const handleDisconnectNodeMode = () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }
    setDisconnectStep('selectingFirstNode');
    setDisconnectFirstNodeId(null);
    setDisconnectSecondNodeId(null);
    alert('연결을 해제할 첫 번째 노드를 선택하세요.');
    setSelectionMode('selectingNode1');
    document.body.style.cursor = 'pointer';
  };

  // 금지구역 생성 모드 활성화 함수
  const handleCreateNoGoZone = () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }
    setIsCreatingNoGoZone(true);
    setIsDeletingNoGoZone(false);
    setDragging(false);
    setDragStart(null);
    setCurrentRect(null);
    setSelectionMode('none');
    document.body.style.cursor = 'crosshair';
  };

  // 금지구역 삭제 모드 활성화 함수
  const handleDeleteNoGoZoneMode = () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }
    setIsDeletingNoGoZone(true);
    setIsCreatingNoGoZone(false);
    setDragging(false);
    setDragStart(null);
    setSelectionMode('none');
    alert('삭제할 금지 구역을 클릭하세요.');
    document.body.style.cursor = 'not-allowed';
  };

  // 금지구역을 삭제하는 함수
  const handleDeleteNoGoZone = async (zoneId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    const confirmDelete = window.confirm('이 금지 구역을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://3.39.166.207:5557/map/no-go-zones/${zoneId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('금지 구역이 성공적으로 삭제되었습니다.');
      setNoGoZones(noGoZones.filter(zone => zone._id !== zoneId));
    } catch (error) {
      console.error('금지 구역 삭제 중 오류 발생:', error);
      alert('금지 구역 삭제에 실패했습니다.');
    } finally {
      setIsDeletingNoGoZone(false);
      resetCursor();
      drawAll();
    }
  };

  // 맵 클릭 시 다양한 모드 처리
  const handleMapClick = async (e) => {
    if (!selectedMap) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { x, y } = mapToWorld(clickX, clickY, imageNaturalWidth, imageNaturalHeight);

    try {
      if (disconnectStep === 'selectingFirstNode') {
        const clickedNode = nodes.find(node => {
          const { x: nodeX, y: nodeY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
          const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
          return distance < 10; // 반경을 10px로 설정
        });

        if (clickedNode) {
          setDisconnectFirstNodeId(clickedNode._id);
          setDisconnectStep('selectingSecondNode');
          alert(`첫 번째 노드 "${clickedNode.name}"가 선택되었습니다. 연결을 해제할 두 번째 노드를 선택하세요.`);
        } else {
          alert('유효한 노드를 클릭해주세요.');
        }
        return;
      }

      if (disconnectStep === 'selectingSecondNode') {
        const clickedNode = nodes.find(node => {
          const { x: nodeX, y: nodeY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
          const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
          return distance < 10; // 반경을 10px로 설정
        });

        if (clickedNode) {
          if (clickedNode._id === disconnectFirstNodeId) {
            alert('같은 노드를 다시 선택할 수 없습니다. 다른 노드를 선택해주세요.');
            return;
          }

          setDisconnectSecondNodeId(clickedNode._id);
          setDisconnectStep('idle'); // 연결 해제 단계 종료
          resetCursor();
        } else {
          alert('유효한 노드를 클릭해주세요.');
        }

        return;
      }

      if (selectionMode === 'selectingNode1') {
        const clickedNode = nodes.find(node => {
          const { x: nodeX, y: nodeY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
          const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
          return distance < 10;
        });

        if (clickedNode) {
          setConnectionData(prev => ({ ...prev, node1: clickedNode }));
          setSelectionMode('selectingNode2');
          alert(`노드 1 "${clickedNode.name}"이 선택되었습니다. 노드 2를 선택하세요.`);
          document.body.style.cursor = 'pointer';
        } else {
          alert('유효한 노드를 클릭해주세요.');
        }
        return;
      }

      if (selectionMode === 'selectingNode2') {
        const clickedNode = nodes.find(node => {
          const { x: nodeX, y: nodeY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
          const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
          return distance < 10;
        });

        if (clickedNode) {
          if (clickedNode._id === connectionData.node1._id) {
            alert('같은 노드를 선택했습니다. 다른 노드를 선택해주세요.');
            return;
          }
          setConnectionData(prev => ({ ...prev, node2: clickedNode }));
          setSelectionMode('selectingWaypoint');
          alert(`노드 2 "${clickedNode.name}"이 선택되었습니다. 웨이포인트를 추가하세요.`);
          document.body.style.cursor = 'crosshair';
        } else {
          alert('유효한 노드를 클릭해주세요.');
        }
        return;
      }

      if (selectionMode === 'selectingWaypoint') {
        const newWaypoint = { x, y };
        setConnectionData(prev => ({
          ...prev,
          waypoints: [...prev.waypoints, newWaypoint]
        }));
        alert(`웨이포인트가 추가되었습니다: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
        // 선택 모드를 유지하여 추가적인 웨이포인트를 추가할 수 있도록 함
      }

      if (isDeletingNoGoZone) {
        const clickedZone = noGoZones.find(zone => {
          const topLeft = mapToMapCoordinates(zone.topLeft.x, zone.topLeft.y);
          const bottomRight = mapToMapCoordinates(zone.bottomRight.x, zone.bottomRight.y);
          return clickX >= topLeft.x && clickX <= bottomRight.x && clickY >= topLeft.y && clickY <= bottomRight.y;
        });

        if (clickedZone) {
          handleDeleteNoGoZone(clickedZone._id);
        } else {
          alert('금지 구역을 클릭해주세요.');
        }

        return;
      }

      if (isNodeConnectionPopupOpen) {
        // NodeConnectionPopup이 열려 있는 동안 맵 클릭을 처리하지 않음
        return;
      }

      if (isCreatingNode) {
        setNodeX(x);
        setNodeY(y);
        setIsCreatingNode(false);
        setIsNodePopupOpen(true);
        resetCursor();
      } else if (isDeletingNode) {
        let nodeToDelete = null;
        for (let node of nodes) {
          const { x: nodeX, y: nodeY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
          const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
          if (distance < 10) { // 반경을 10px로 설정
            nodeToDelete = node;
            break;
          }
        }
      
        if (nodeToDelete) {
          const confirmDelete = window.confirm(`노드 "${nodeToDelete.name}"를 삭제하시겠습니까?`);
          if (confirmDelete) {
            try {
              const token = localStorage.getItem('token');
              await axios.delete(`http://3.39.166.207:5557/map/node/${nodeToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              alert('노드가 성공적으로 삭제되었습니다.');
      
              await fetchNodes(selectedMap._id);
              drawAll();
      
              setIsDeletingNode(false);
            } catch (error) {
              console.error('노드 삭제 중 오류 발생:', error);
              alert('노드 삭제에 실패했습니다.');
            }
          }
        } else {
          alert('해당 위치에 노드를 찾을 수 없습니다.');
        }
      }
    } catch (error) {
      console.error('맵 클릭 처리 중 오류 발생:', error);
      alert('맵 클릭 처리 중 오류가 발생했습니다.');
    } finally {
      await fetchNodes(selectedMap._id);
      drawAll();
    }
  };

  // 노드 간 총 꺾인 경로 거리 계산 함수
  const calculateTotalDistance = (node1Id, node2Id, waypoints) => {
    const node1 = nodes.find(n => n._id === node1Id);
    const node2 = nodes.find(n => n._id === node2Id);
    if (!node1 || !node2) return 0;

    let totalDistance = 0;

    // 거리 계산 함수 (직선 거리)
    const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    if (waypoints.length > 0) {
      totalDistance += distance(node1.x, node1.y, waypoints[0].x, waypoints[0].y);

      for (let i = 0; i < waypoints.length - 1; i++) {
        totalDistance += distance(waypoints[i].x, waypoints[i].y, waypoints[i + 1].x, waypoints[i + 1].y);
      }

      totalDistance += distance(waypoints[waypoints.length - 1].x, waypoints[waypoints.length - 1].y, node2.x, node2.y);
    } else {
      totalDistance += distance(node1.x, node1.y, node2.x, node2.y);
    }

    return totalDistance;
  };

  // 노드 생성을 제출하는 함수
  const handleSubmitNode = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    if (nodeName.trim().length === 0) {
      alert('노드 이름을 입력해주세요.');
      return;
    }

    try {
      await axios.post('http://3.39.166.207:5557/map/nodes', {
        name: nodeName,
        x: nodeX,
        y: nodeY,
        mapId: selectedMap._id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('노드가 성공적으로 생성되었습니다.');
      setIsNodePopupOpen(false);
      setNodeName('');
      setNodeX(null);
      setNodeY(null);
      await fetchNodes(selectedMap._id);
      drawAll();
    } catch (error) {
      console.error('노드 생성 중 오류 발생:', error);
      alert('노드 생성에 실패했습니다.');
    }
  };

  // 맵 삭제하는 함수
  const handleDeleteMap = async (mapId) => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    const confirmDelete = window.confirm('이 맵을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      await axios.put(`http://3.39.166.207:5557/map/delete/${mapId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert('맵이 성공적으로 삭제되었습니다.');
      await fetchMaps();
      if (selectedMap && selectedMap._id === mapId) {
        setSelectedMap(null);
        setMapImage(null);
        setNodes([]);
        setNoGoZones([]);
      }
    } catch (error) {
      console.error('맵 삭제 중 오류 발생:', error);
      alert('맵 삭제에 실패했습니다.');
    }
  };

  // 맵 파일 변경 시 호출되는 함수
  const handleFileChange = (e) => {
    setMapFile(e.target.files[0]);
  };

  // YAML 파일 변경 시 호출되는 함수
  const handleYamlFileChange = (e) => {
    setYamlFile(e.target.files[0]);
  };

  // 맵 업데이트를 처리하는 함수
  const handleUpdateMap = async (e) => {
    e.preventDefault();

    if (editName.length < 2) {
      alert('맵 이름은 최소 2자 이상이어야 합니다.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      await axios.put(`http://3.39.166.207:5557/map/update/${selectedMap._id}`, {
        name: editName,
        description: editDescription,
        isMonitored
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('맵이 성공적으로 업데이트되었습니다.');
      setIsEditPopupOpen(false);
      await fetchMaps();
    } catch (error) {
      console.error('맵 업데이트 중 오류 발생:', error);
      alert(`맵 업데이트 중 오류 발생: ${error.response?.data?.message || error.message}`);
    }
  };

  // 맵 업로드를 처리하는 함수
  const handleUploadMap = async (e) => {
    e.preventDefault();

    if (uploadName.length < 2) {
      alert('맵 이름은 최소 2자 이상이어야 합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('name', uploadName);
    formData.append('description', uploadDescription);
    formData.append('file', mapFile);
    formData.append('yaml', yamlFile);

    const token = localStorage.getItem('token');

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      await axios.post('http://3.39.166.207:5557/map/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('맵이 성공적으로 업로드되었습니다.');
      setIsUploadPopupOpen(false);
      await fetchMaps();
    } catch (error) {
      console.error('맵 업로드 중 오류 발생:', error);
      alert('맵 업로드에 실패했습니다.');
    }
  };

  // 맵 수정 팝업을 여는 함수
  const openEditPopup = (map) => {
    setSelectedMap(map);
    setEditName(map.name);
    setEditDescription(map.description);
    setIsMonitored(map.isMonitored || false);
    setIsEditPopupOpen(true);
  };

  // 노드 생성 모드를 활성화하는 함수
  const handleCreateNodeMode = () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }
    setIsCreatingNode(true);
    setIsDeletingNoGoZone(false);
    setSelectionMode('none');
    document.body.style.cursor = 'crosshair';
  };

  // URL 객체 해제를 위한 useEffect
  useEffect(() => {
    return () => {
      if (mapImage) {
        URL.revokeObjectURL(mapImage);
      }
    };
  }, [mapImage]);

  // 노드 삭제 모드를 활성화하는 함수
  const handleDeleteNodeMode = () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }
    setIsDeletingNode(true);
    setIsDeletingNoGoZone(false);
    setIsCreatingNoGoZone(false);
    setSelectionMode('none');
    document.body.style.cursor = 'not-allowed';
  };

  // Send to Robots 버튼과 관련된 함수
  const handleSendMap = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      await axios.post('http://3.39.166.207:5559/robot/send_map', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('맵이 로봇에게 성공적으로 전송되었습니다.');
    } catch (error) {
      console.error('맵을 로봇에게 전송하는 중 오류 발생:', error);
      alert(`맵을 로봇에게 전송하는 중 오류 발생: ${error.response?.data?.message || error.message}`);
    }
  };

  // 맵 패치를 처리하는 함수 (기존 경로 삭제 후 재계산)
  const handlePatchMap = async () => {
    if (!selectedMap) {
      alert('먼저 맵을 선택해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    const confirmPatch = window.confirm('선택한 맵의 모든 노드 간의 최단 경로를 계산하고 저장하시겠습니까?');
    if (!confirmPatch) return;

    setIsPatchingMap(true);

    try {
      // Step 1: 기존 경로 데이터 삭제
      await axios.delete(`http://3.39.166.207:5557/map/shortpaths/map/${selectedMap._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('기존 ShortPath 데이터가 삭제되었습니다.');

      // Step 2: 새로운 경로 계산 및 저장
      const response = await axios.post('http://3.39.166.207:5557/map/calculate-paths', {
        mapId: selectedMap._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        alert('맵 패치가 성공적으로 완료되었습니다.');
        await fetchNodes(selectedMap._id);
        drawAll();
      } else {
        alert('맵 패치에 실패했습니다.');
      }
    } catch (error) {
      console.error('맵 패치 중 오류 발생:', error);
      alert(`맵 패치 중 오류 발생: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsPatchingMap(false);
    }
  };

  // 노드 연결을 생성하는 함수
  const handleNodeConnectionCreate = async ({ node1, node2, waypoints }) => {
    if (!node1 || !node2) {
      alert('노드 1과 노드 2를 모두 선택해주세요.');
      return;
    }

    try {
      const totalDistance = calculateTotalDistance(node1._id, node2._id, waypoints);

      const token = localStorage.getItem('token');
      await axios.post(`http://3.39.166.207:5557/map/node/connect`, {
        node1: node1._id,
        node2: node2._id,
        waypoints: waypoints, // 웨이포인트는 좌표값으로 전달
        distance: totalDistance,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`노드가 성공적으로 연결되었습니다. 전체 꺾인 경로의 가중치: ${totalDistance.toFixed(2)}`);

      setIsNodeConnectionPopupOpen(false);
      setConnectionData({ node1: null, node2: null, waypoints: [] });
      await fetchNodes(selectedMap._id);
      drawAll();

      // 상태 초기화 및 커서 복구
      setSelectionMode('none');
      resetCursor();
    } catch (error) {
      console.error('노드 연결 중 오류 발생:', error);
      alert('노드 연결에 실패했습니다.');
      // 오류 발생 시에도 상태를 초기화하고 커서를 복구
      setSelectionMode('none');
      resetCursor();
    }
  };

  // 노드 연결 해제 성공 시 처리하는 함수
  const handleDisconnectSuccess = async (isDeleted) => {
    if (isDeleted) {
      alert('노드 간의 연결이 성공적으로 해제되었습니다.');
      setDisconnectFirstNodeId(null);
      setDisconnectSecondNodeId(null);
      await fetchNodes(selectedMap._id);
      drawAll();
    } else {
      alert('노드 간의 연결 해제에 실패했습니다.');
    }
    // 상태 초기화 및 커서 복구
    setSelectionMode('none');
    resetCursor();
  };

  // NodeConnectionPopup에서 노드 선택 시작 함수
  const startSelectingNode1 = () => {
    setSelectionMode('selectingNode1');
    alert('노드 1을 선택하세요.');
    document.body.style.cursor = 'pointer';
  };

  const startSelectingNode2 = () => {
    setSelectionMode('selectingNode2');
    alert('노드 2를 선택하세요.');
    document.body.style.cursor = 'pointer';
  };

  const startSelectingWaypoint = () => {
    setSelectionMode('selectingWaypoint');
    alert('웨이포인트를 선택하세요.');
    document.body.style.cursor = 'crosshair';
  };

  return (
    <div className="map-management-page">
      {/* 상단 네비게이션 바 */}
      <header className="map-management-header">
        <UserInfo />
        <LogoutButton />
      </header>
      <Navbar />

      {/* 툴바: 네비게이션 아래에 위치 */}
      <div className="toolbar">
        <button onClick={handleCreateNodeMode} className="create-node-button">
          <FontAwesomeIcon icon={faPlus} /> 노드 생성
        </button>
        <button onClick={handleDeleteNodeMode} className="delete-node-button">
          <FontAwesomeIcon icon={faEdit} /> 노드 삭제
        </button>
        <button onClick={handleConnectNodeMode} className="connect-node-button">
          <FontAwesomeIcon icon={faLink} /> 노드 연결
        </button>
        <button onClick={handleDisconnectNodeMode} className="disconnect-node-button">
          <FontAwesomeIcon icon={faUnlink} /> 연결 해제
        </button>
        <button
          onClick={handleCreateNoGoZone}
          className="create-nogozone-button"
        >
          금지 구역 생성
        </button>
        <button
          onClick={handleDeleteNoGoZoneMode}
          className="delete-nogozone-button"
        >
          금지 구역 해제
        </button>
      </div>

      {/* 맵 리스트와 이미지 컨텐츠 */}
      <div className="map-management-content">
        {/* 맵 리스트 컨테이너 */}
        <div className="map-list-container">
          <h2 className="map-list-header">
            맵 리스트
            <button
              onClick={() => setIsUploadPopupOpen(true)}
              className="add-map-button"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </h2>
          <ul className="map-list">
            {maps.map((map) => (
              <li
                key={map._id}
                className={`map-list-item ${selectedMap?._id === map._id ? 'selected-map' : ''}`}
              >
                <span
                  onClick={() => handleSelectMap(map)}
                  className="map-list-item-name"
                >
                  {map.name}
                </span>
                <button
                  onClick={() => openEditPopup(map)}
                  className="edit-map-button"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDeleteMap(map._id)}
                  className="delete-map-button"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>

          {selectedMap && (
            <div className="map-description">
              <h3>맵 설명</h3>
              <p>{selectedMap.description}</p>
            </div>
          )}
        </div>

        {/* 지도 이미지와 노드 렌더링 및 노드 리스트 영역 */}
        <div className="map-image-and-node-list">
          {/* 지도 이미지와 노드 렌더링 영역 */}
          <div
            className="map-image-container"
            style={{ position: 'relative' }}
          >
            {mapImage ? (
              <canvas
                ref={canvasRef}
                className="map-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleMapClick} // 맵 클릭 이벤트 추가
                style={{
                  cursor:
                    isCreatingNode
                      ? 'crosshair'
                      : isCreatingNoGoZone
                      ? 'crosshair'
                      : isDeletingNoGoZone
                      ? 'not-allowed'
                      : selectionMode !== 'none'
                      ? 'crosshair'
                      : 'default',
                }} // 커서 스타일 수정
              />
            ) : (
              <p>맵을 선택하여 이미지를 확인하세요.</p>
            )}

            {/* 플로팅 Send to Robots 버튼과 Map Patch 버튼 추가 */}
            {selectedMap && (
              <div className="floating-buttons">
                <button
                  className="send-to-robots-button"
                  onClick={handleSendMap}
                >
                  로봇에게 전송
                </button>
                <button
                  className="map-patch-button"
                  onClick={handlePatchMap}
                  disabled={isPatchingMap}
                >
                  {isPatchingMap ? '맵 패치 중...' : '맵 패치'}
                </button>
              </div>
            )}
          </div>

          {/* 오른쪽에 노드 목록 표시 */}
          <NodeList mapId={selectedMap?._id} />
        </div>
      </div>

      {/* Node 생성 팝업 */}
      {isNodePopupOpen && (
        <div className="popup-container">
          <div className="node-popup">
            <h3>노드 생성</h3>
            <p>X: {nodeX.toFixed(2)}, Y: {nodeY.toFixed(2)}</p>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="노드 이름 입력"
              className="popup-input"
            />
            <div className="popup-button-container">
              <button onClick={handleSubmitNode} className="popup-submit-button">
                생성
              </button>
              <button
                onClick={() => setIsNodePopupOpen(false)}
                className="popup-cancel-button"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Upload Popup */}
      {isUploadPopupOpen && (
        <div className="popup-container">
          <div className="upload-popup">
            <h3>맵 업로드</h3>
            <form onSubmit={handleUploadMap}>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="맵 이름"
                required
                className="popup-input"
              />
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="맵 설명"
                required
                className="popup-textarea"
              />
              <label>맵 파일 (.pgm, .png, .jpg)</label>
              <input
                type="file"
                accept=".pgm,.png,.jpg"
                onChange={handleFileChange}
                required
                className="popup-file-input"
              />
              <label>YAML 파일 (.yaml)</label>
              <input
                type="file"
                accept=".yaml"
                onChange={handleYamlFileChange}
                required
                className="popup-file-input"
              />
              <div className="popup-button-container">
                <button type="submit" className="popup-submit-button">
                  업로드
                </button>
                <button
                  type="button"
                  onClick={() => setIsUploadPopupOpen(false)}
                  className="popup-cancel-button"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Map Popup */}
      {isEditPopupOpen && (
        <div className="popup-container">
          <div className="edit-popup">
            <h3>맵 수정</h3>
            <form onSubmit={handleUpdateMap}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="맵 이름"
                required
                className="popup-input"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="맵 설명"
                required
                className="popup-textarea"
              />
              <label style={{ marginTop: '10px', color: '#333' }}>
                <input
                  type="checkbox"
                  checked={isMonitored}
                  onChange={(e) => setIsMonitored(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                모니터링 맵으로 설정
              </label>
              <div className="popup-button-container">
                <button type="submit" className="popup-submit-button">
                  업데이트
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditPopupOpen(false)}
                  className="popup-cancel-button"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.y + 10}px`,
            left: `${tooltipPosition.x + 10}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000,
            fontSize: '12px',
          }}
        >
          {hoveredNode.name}
        </div>
      )}

      {/* NodeDisconnect 컴포넌트를 조건부로 렌더링 */}
      {disconnectFirstNodeId && disconnectSecondNodeId && (
        <NodeDisconnect
          firstNodeId={disconnectFirstNodeId}
          secondNodeId={disconnectSecondNodeId}
          onDisconnectSuccess={handleDisconnectSuccess}
        />
      )}

      {/* NodeConnectionPopup 컴포넌트 */}
      {isNodeConnectionPopupOpen && (
        <NodeConnectionPopup
          connectionData={connectionData}
          onClose={() => {
            setIsNodeConnectionPopupOpen(false);
            setSelectionMode('none'); // 선택 모드 초기화
            resetCursor(); // 커서 복구
          }}
          onCreate={handleNodeConnectionCreate}
          setSelectionMode={setSelectionMode}
          startSelectingNode1={startSelectingNode1}
          startSelectingNode2={startSelectingNode2}
          startSelectingWaypoint={startSelectingWaypoint}
        />
      )}

      {/* 로딩 인디케이터 추가 */}
      {isPatchingMap && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default Mapmanage;
