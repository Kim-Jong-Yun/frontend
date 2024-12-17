import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import TeleopControl from './TeleopControl';
import './RobotListComponent.css';

function RobotListComponent({ robots }) {
  const [expandedRobotId, setExpandedRobotId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTeleopPopup, setShowTeleopPopup] = useState(false);
  
  const token = localStorage.getItem('token');

  const toggleExpand = (robotId) => {
    setExpandedRobotId((prev) => (prev === robotId ? null : robotId));
  };

  const fetchMonitoredMapTasks = async () => {
    try {
      const mapResponse = await axios.get('http://3.35.87.118:5557/map/monitored', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const monitoredMapData = mapResponse.data;
      
      if (monitoredMapData?._id) {
        const taskResponse = await axios.get(`http://3.35.87.118:8080/task/tasks?mapId=${monitoredMapData._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTaskList(taskResponse.data);
      } else {
        setTaskList([]);
      }
    } catch (error) {
      console.error('작업 리스트를 가져오는 중 오류가 발생했습니다:', error);
      setTaskList([]);
    }
  };

  const handleAddJob = async (robot) => {
    setSelectedRobot(robot);
    await fetchMonitoredMapTasks();
    setShowPopup(true);
  };

  const handleTaskSelection = (taskId) => {
    const selected = taskList.find(task => task._id === taskId);
    setSelectedTask(selected);
  };

  const handleConfirmAddJob = async () => {
    if (!selectedTask || !selectedTask.workflow || selectedTask.workflow.length === 0) {
      alert('유효한 작업과 워크플로우 정보를 선택하세요.');
      return;
    }

    try {
      for (const { node, step } of selectedTask.workflow) {
        console.log("Sending data:", { robotId: selectedRobot._id, node, step });

        await axios.post(
          'http://3.35.87.118:5559/robot/addWorkflow',
          {
            robotId: selectedRobot._id, // 로봇의 _id 전달
            node, // 각 워크플로우의 node 전달
            step, // 각 워크플로우의 step 전달
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      alert(`${selectedRobot.name}에 "${selectedTask.name}" 작업이 모든 워크플로우 단계에 따라 큐에 할당되었습니다.`);
      setShowPopup(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('작업 큐에 할당 중 오류가 발생했습니다:', error);
      alert('작업 큐에 할당에 실패했습니다.');
    }
  };

  const handleOpenTeleop = (robot) => {
    setSelectedRobot(robot);
    setShowTeleopPopup(true);
  };

  const handleCloseTeleop = () => {
    setShowTeleopPopup(false);
    setSelectedRobot(null);
  };

  return (
    <div className="robot-list">
  
      <ul>
        {robots.length > 0 ? (
          robots.map((robot) => (
            <li key={robot._id} className="robot-item">
              <div className="robot-item-header">
                <span><strong>name : </strong> {robot.name}</span>
                <span><strong>status :  </strong> {robot.status?.state || 'Unknown'}</span>
                <span><strong>battery : </strong> {robot.status?.battery || 'N/A'}%</span>
                <button
                  onClick={() => toggleExpand(robot._id)}
                  className="expand-btn"
                  aria-label={expandedRobotId === robot._id ? '접기' : '펼치기'}
                >
                  {expandedRobotId === robot._id ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>

              <div className={`robot-details ${expandedRobotId === robot._id ? 'expanded' : ''}`}>
                <p><strong>IP:</strong> {robot.ip}</p>
                <p><strong>위치:</strong> x: {robot.location.x}, y: {robot.location.y}</p>
                <p><strong>속도:</strong> {robot.status?.speed || '0'} cm/s</p>
                <p><strong>배터리 상태:</strong> {robot.status?.battery || 'N/A'}%</p>

                <div className="robot-job-section">
                  <span><strong>Job:</strong></span>
                  <button 
                    className="add-job-btn" 
                    onClick={() => handleAddJob(robot)}
                  >
                    +
                  </button>
                </div>

                <div className="robot-control-section">
                  <button 
                    className="control-circle-btn" 
                    onClick={() => handleOpenTeleop(robot)}
                  >
                  </button>
                  <span>조종</span>
                </div>
              </div>
            </li>
          ))
        ) : (
          <p>연결된 로봇이 없습니다.</p>
        )}
      </ul>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>{selectedRobot?.name}에 작업 추가</h3>
            <select onChange={(e) => handleTaskSelection(e.target.value)} value={selectedTask?._id || ''}>
              <option value="">작업을 선택하세요</option>
              {taskList.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.name}
                </option>
              ))}
            </select>
            <button onClick={handleConfirmAddJob} disabled={!selectedTask}>작업 추가</button>
            <button onClick={() => setShowPopup(false)}>취소</button>
          </div>
        </div>
      )}

      {showTeleopPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <TeleopControl robotName={selectedRobot?.name} onClose={handleCloseTeleop} />
          </div>
        </div>
      )}
    </div>
  );
}

export default RobotListComponent;
