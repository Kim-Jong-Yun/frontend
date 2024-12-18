import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';

const MonitoringPage = () => {
  const [mapUrl, setMapUrl] = useState(null);
  const [robots, setRobots] = useState([]);
  const canvasRef = useRef(null);
  const [mapResolution, setMapResolution] = useState(0.05); // 기본 값, 실제 파일에서 가져올 예정
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // 지도와 메타데이터 가져오기 및 WebSocket 연결
  useEffect(() => {
    fetchMonitoredMap();
    fetchMapMetadata();

    const ws = new WebSocket('ws://3.39.166.207:5050'); // WebSocket 서버 주소

    ws.onmessage = (event) => {
      const robotPositions = JSON.parse(event.data);
      setRobots(robotPositions);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      ws.close(); // 컴포넌트 언마운트 시 WebSocket 닫기
    };
  }, []);

  // 지도 파일 가져오기
  const fetchMonitoredMap = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://3.39.166.207:5557/map/monitored/file', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setMapUrl(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setMapDimensions({ width: img.width, height: img.height });
      };
    } catch (error) {
      console.error('Error fetching monitored map:', error);
    }
  };

  // 지도 메타데이터 가져오기
  const fetchMapMetadata = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://3.39.166.207:5557/map/monitored/metadata', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const metadata = response.data;
      const resolution = parseFloat(metadata.match(/resolution:\s*(\d+.\d+)/)[1]);
      setMapResolution(resolution);
    } catch (error) {
      console.error('Error fetching map metadata:', error);
    }
  };

  // 월드 좌표계를 지도 좌표계로 변환
  const worldToMap = (x, y, mapWidth, mapHeight, resolution) => {
    const mapX = (x + mapWidth * resolution / 2) / resolution;
    const mapY = mapHeight - (y + mapHeight * resolution / 2) / resolution;
    return { mapX, mapY };
  };

  // 지도와 로봇 위치 그리기
  const drawMapAndRobots = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const mapImage = new Image();
    mapImage.src = mapUrl;

    mapImage.onload = () => {
      canvas.width = mapImage.width;
      canvas.height = mapImage.height;

      // 기존 캔버스 내용 지우기
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mapImage, 0, 0);

      // 로봇 위치 그리기
      robots.forEach((robot) => {
        const { x, y } = robot;
        const { mapX, mapY } = worldToMap(x, y, mapImage.width, mapImage.height, mapResolution);
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(mapX, mapY, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    };
  };

  // 지도나 로봇 위치가 변경될 때마다 다시 그리기
  useEffect(() => {
    if (mapUrl) {
      drawMapAndRobots();
    }
  }, [mapUrl, robots]);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <UserInfo />
        <LogoutButton />
      </header>
      <Navbar />
      <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Monitoring Page</h2>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        {mapUrl ? (
          <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }}></canvas>
        ) : (
          <p>Loading map...</p>
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;
