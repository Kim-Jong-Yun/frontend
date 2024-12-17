import React, { useState } from 'react';
import './TestPage.css'; // CSS 파일 임포트
import { FaChevronUp, FaChevronDown } from 'react-icons/fa'; // 아이콘 추가

function TaskLogComponent({ tasks }) {
  const [isOpen, setIsOpen] = useState(false);

  // 작업 로그 패널을 열거나 닫는 함수
  const toggleTaskLog = () => {
    setIsOpen(!isOpen); // 현재 상태에 따라 열고 닫음
  };

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? 'N/A' : parsedDate.toLocaleString();
  };

  return (
    <div>
      {/* 작업 로그 슬라이드 패널 */}
      <div className={`task-log-slide ${isOpen ? 'open' : 'closed'}`}>
        {/* 슬라이드 패널의 버튼 */}
        <button className="task-log-toggle-btn" onClick={toggleTaskLog}>
          {isOpen ? <FaChevronDown /> : <FaChevronUp />} {/* 아이콘 변경 */}
        </button>

        {/* 작업 로그 내용 */}
        {isOpen && (
          <div className="task-log-content">
            <table>
              <thead>
                <tr>
                  <th>AMR</th>
                  <th>작업</th>
                  <th>시간</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task, index) => (
                    <tr key={index}>
                      <td>{task.robotName} ({task.robotIp})</td>
                      <td>{task.nodeName} - {task.step}</td>
                      <td>{formatDate(task.timestamp)}</td>
                      <td>{task.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">작업 로그가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskLogComponent;
