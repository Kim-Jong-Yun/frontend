import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import axios from 'axios';
import WebcamStream from '../../components/WebcamStream';
import SlamStream from '../../components/SlamStream';

function MapCreatePage() {
  const [robots, setRobots] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState('');

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://13.209.28.158:5559/robot/robots', {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        setRobots(response.data);
      } catch (error) {
        console.error('Error fetching robots:', error);
      }
    };

    fetchRobots();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <UserInfo />
        <LogoutButton />
      </header>
      <div style={{ display: 'flex' }}>
        <Navbar />
      </div>
      <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Map Create</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label htmlFor="robot-select">로봇 선택:</label>
        <select
          id="robot-select"
          onChange={(e) => setSelectedRobot(e.target.value)}
          value={selectedRobot}
          style={{ padding: '10px', margin: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">로봇을 선택하세요</option>
          {robots.map(robot => (
            <option key={robot._id} value={robot._id}>{robot.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '45%' }}>
          <h3 style={{ textAlign: 'center' }}>SLAM 화면</h3>
          {selectedRobot && <SlamStream />}
        </div>
        <div style={{ width: '45%' }}>
          <h3 style={{ textAlign: 'center' }}>WebCam 화면</h3>
          {selectedRobot && <WebcamStream selectedRobot={selectedRobot} />}
        </div>
      </div>
    </div>
  );
}

export default MapCreatePage;



