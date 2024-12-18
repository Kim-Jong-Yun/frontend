import React, { useState } from 'react';
import axios from 'axios';

function RobotRegisterPage({ onClose }) {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [model, setModel] = useState('');
  const [sshUser, setSshUser] = useState(''); // sshUser 상태 추가

  const handleRegister = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    // 이름 검증: 한글 입력 불가, 최소 길이 확인
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      alert('Robot name must not contain Korean characters and should only include letters, numbers, hyphens, or underscores.');
      return;
    }

    if (name.length < 2) {
      alert('Robot name must be at least 2 characters long');
      return;
    }

    // 모델명 검증: 한글 입력 불가
    if (!/^[a-zA-Z0-9-_]+$/.test(model)) {
      alert('Model name must not contain Korean characters and should only include letters, numbers, hyphens, or underscores.');
      return;
    }

    // SSH 유저명 검증: 한글 입력 불가
    if (!/^[a-zA-Z0-9-_]+$/.test(sshUser)) {
      alert('SSH Username must not contain Korean characters and should only include letters, numbers, hyphens, or underscores.');
      return;
    }

    // IP 주소 검증
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
    if (!ipRegex.test(ip)) {
      alert('Please enter a valid IP address (e.g., 192.168.0.1)');
      return;
    }

    if (!token) {
      alert('No token found, please log in again.');
      return;
    }

    try {
      await axios.post(
        'http://13.209.28.158:5559/robot/register',
        { name, ip, model, sshUser }, // sshUser 추가
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      alert('Robot registered successfully');
      setName('');
      setIp('');
      setModel('');
      setSshUser(''); // sshUser 상태 초기화

      // 부모 컴포넌트에서 전달받은 onClose 함수 호출
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error registering robot:', error);
      alert('Failed to register robot');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      {/* 닫기 버튼 추가 */}
      <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#000',
          }}
          aria-label="Close"
        >
          ✖
        </button>
      </header>
     
      <form
        onSubmit={handleRegister}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <input
          type="text"
          placeholder="Robot Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Robot IP"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          required
          style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="Robot Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder="SSH Username"
          value={sshUser}
          onChange={(e) => setSshUser(e.target.value)} // sshUser 상태 업데이트
          required
          style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            margin: '20px 0',
            borderRadius: '5px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Register Robot
        </button>
      </form>
    </div>
  );
}

export default RobotRegisterPage;
