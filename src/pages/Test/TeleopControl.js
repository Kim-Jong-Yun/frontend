import React, { useEffect } from 'react';
import ROSLIB from 'roslib';
import axios from 'axios';
import './TeleopControl.css';

function TeleopControl({ robotName, onClose }) {
  const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090', // rosbridge WebSocket 주소
  });

  const cmdVel = new ROSLIB.Topic({
    ros: ros,
    name: `/${robotName}/cmd_vel`, // 로봇 이름을 포함한 토픽 경로
    messageType: 'geometry_msgs/Twist',
  });

  const sendCommand = (linear, angular) => {
    const twist = new ROSLIB.Message({
      linear: { x: linear, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: angular },
    });
    cmdVel.publish(twist);
  };

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowUp':
        sendCommand(0.5, 0); // 전진
        break;
      case 'ArrowDown':
        sendCommand(-0.5, 0); // 후진
        break;
      case 'ArrowLeft':
        sendCommand(0, 0.5); // 좌회전
        break;
      case 'ArrowRight':
        sendCommand(0, -0.5); // 우회전
        break;
      case ' ':
        sendCommand(0, 0); // 정지
        break;
      default:
        break;
    }
  };

  const handleButtonClick = (direction) => {
    switch (direction) {
      case 'forward':
        sendCommand(0.5, 0); // 전진
        break;
      case 'backward':
        sendCommand(-0.5, 0); // 후진
        break;
      case 'left':
        sendCommand(0, 0.5); // 좌회전
        break;
      case 'right':
        sendCommand(0, -0.5); // 우회전
        break;
      case 'stop':
        sendCommand(0, 0); // 정지
        break;
      default:
        break;
    }
  };

  // rosbridge 서버 시작 함수
  const startRosbridgeServer = async () => {
    try {
      await axios.post('http://3.35.87.118:5559/robot/rosbridge/start');
      alert('rosbridge 서버가 성공적으로 시작되었습니다.');
    } catch (error) {
      console.error('rosbridge 서버 시작 오류:', error);
      alert('rosbridge 서버 시작에 실패했습니다.');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="popup-overlay">
      <div className="popup">
        {/* rosbridge 서버 시작 버튼 */}
        <button onClick={startRosbridgeServer} className="start-rosbridge-btn">
          Start rosbridge
        </button>

        <h3>{robotName} Teleop Control</h3>
        <div className="teleop-controls">
          <p>Use arrow keys or buttons to control the robot. Press space to stop.</p>
          <div className="button-controls">
            <button onClick={() => handleButtonClick('forward')}>▲</button>
            <div>
              <button onClick={() => handleButtonClick('left')}>◀</button>
              <button onClick={() => handleButtonClick('stop')}>■</button>
              <button onClick={() => handleButtonClick('right')}>▶</button>
            </div>
            <button onClick={() => handleButtonClick('backward')}>▼</button>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    </div>
  );
}

export default TeleopControl;
