import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';

import axios from 'axios';
import MapComponent from './MapComponent'; // MapComponent 임포트
import RobotListComponent from './RobotListComponent'; // RobotListComponent 임포트
import TaskLogComponent from './TaskLogComponent'; // TaskLogComponent 임포트
import './TestPage.css';

function TestPage() {
  const [robots, setRobots] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [mapUrl, setMapUrl] = useState(null); // 지도 URL 상태
  const [mapId, setMapId] = useState(null); // mapId 상태

  useEffect(() => {
    const fetchData = async () => {
      await fetchMonitoredMap(); // 지도 불러오기
      fetchAllTasks(); // 모든 작업 로그 API 호출
    };
    fetchData();

    // 2초마다 로봇 데이터를 가져오는 타이머 설정
    const intervalId = setInterval(() => {
      fetchRobots(); // 로봇 리스트 API 호출
    }, 2000);

    // 컴포넌트가 언마운트될 때 타이머 정리
    return () => clearInterval(intervalId);
  }, []);

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      window.location.href = '/login'; // 토큰이 없으면 로그인 페이지로 리디렉션
      return null;
    }
    return token;
  };

  const fetchMonitoredMap = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // 모니터링 중인 맵의 정보와 ID를 가져오는 API 호출
      const response = await axios.get('http://13.209.28.158:5557/map/monitored', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapData = response.data;
      const mapFileResponse = await axios.get(`http://13.209.28.158:5557/map/file/${mapData._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(mapFileResponse.data);

      setMapUrl(url); // 지도 URL 설정
      setMapId(mapData._id); // 지도 ID 설정
    } catch (error) {
      console.error('모니터링 지도 가져오기 오류:', error);
    }
  };

  const fetchRobots = async () => {
    console.log('로봇 정보 가져오는 중');
    const token = getToken();
    if (!token) {
      console.log('토큰이 없어 fetchRobots 종료');
      return;
    }

    try {
      const response = await axios.get('http://13.209.28.158:5559/robot/robots', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRobots(response.data); // 로봇 데이터를 상태에 저장
    } catch (error) {
      console.error('로봇 정보 가져오기 오류:', error);
    }
  };

  const fetchAllTasks = async () => {
    console.log('모든 작업 로그 가져오는 중');
    const token = getToken();
    if (!token) {
      console.log('토큰이 없어 fetchAllTasks 종료');
      return;
    }
  
    try {
      const response = await axios.get('http://13.209.28.158:8080/task/task-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // API 응답 데이터를 `TaskLogComponent`에 맞게 변환
      const formattedTasks = response.data.taskLogs.map((task) => ({
        robotName: task.robotName,
        robotIp: task.robotIp,
        nodeName: task.nodeName,
        step: task.step,
        timestamp: task.timestamp,
        status: task.status,
      }));
  
      setTasks(formattedTasks); // 변환된 데이터를 상태로 설정
    } catch (error) {
      console.error('작업 로그 가져오기 오류:', error);
    }
  };

  return (
    <div className="test-page">
      <header className="header">
        <UserInfo />
        <LogoutButton />
      </header>
      <Navbar />
      <h1></h1>
      <div className="main-content">
        {/* MapComponent에 robots, mapUrl, mapId 전달 */}
        <MapComponent robots={robots} mapUrl={mapUrl} mapId={mapId} />
        <RobotListComponent robots={robots} /> {/* 로봇 리스트 컴포넌트 */}
      </div>
      {/* 작업 로그 컴포넌트 */}
      <TaskLogComponent tasks={tasks} />
    </div>
  );
}

export default TestPage;
