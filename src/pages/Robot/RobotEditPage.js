import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import Logo from '../../components/Common/Logo';
import axios from 'axios';
import './RobotEditPage.css';
import RobotRegisterPage from './RobotRegisterPage';

// 환경 변수로 API URL 관리 (필요 시 .env 파일에 추가)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://3.39.166.207:5559/robot';

function RobotEditPage() {
  const [robots, setRobots] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ip, setIp] = useState(''); // IP 주소 상태 추가
  const [active, setActive] = useState(1);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [workflowQueue, setWorkflowQueue] = useState([]); // 작업 큐 상태 추가
  const [selectedRobotId, setSelectedRobotId] = useState(null); // 선택한 로봇의 _id 상태 추가
  const [pendingWorkflowDeletions, setPendingWorkflowDeletions] = useState([]); // 워크플로우 삭제 대기 목록
  const [isSaving, setIsSaving] = useState(false); // Save 버튼 상태 관리
  const [isStarting, setIsStarting] = useState(false); // "작동" 버튼 상태 관리
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  const token = localStorage.getItem('token');

  // API 요청 헤더 설정
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // 로봇 데이터 가져오기
  const fetchRobots = useCallback(async (preserveSelectedRobotId = null) => {
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/robots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRobots(response.data);

      let robotToSelect;
      if (preserveSelectedRobotId) {
        robotToSelect = response.data.find(robot => robot._id === preserveSelectedRobotId);
      } else if (response.data.length > 0) {
        robotToSelect = response.data[0];
      }

      if (robotToSelect) {
        handleSelectRobot(robotToSelect);
      }
    } catch (error) {
      console.error('로봇을 가져오는 중 오류 발생:', error);
      alert('로봇을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token]);

  // 워크플로우 큐 가져오기
  const fetchWorkflowQueue = useCallback(async (robotId) => {
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/robot/${robotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // API 응답 구조 확인 (필요 시 수정)
      console.log('워크플로우 API 응답:', response.data);

      // 예시: response.data.robot.currentWorkflow
      const robotData = response.data.robot || response.data; // API 응답에 따라 조정

      let workflows = robotData.workflows || [];

      // "In Progress" 상태인 워크플로우 찾기 (단일 워크플로우 가정)
      const inProgressWorkflow = workflows.find(wf => wf.status === 'In Progress');

      if (inProgressWorkflow) {
        // "In Progress" 워크플로우를 배열에서 제거
        workflows = workflows.filter(wf => wf._id !== inProgressWorkflow._id);
        // "In Progress" 워크플로우를 첫 번째에 배치
        setWorkflowQueue([inProgressWorkflow, ...workflows]);
      } else {
        // "In Progress" 워크플로우가 없을 경우, 첫 번째 칸을 공란으로 설정
        const placeholder = { isPlaceholder: true };
        setWorkflowQueue([placeholder, ...workflows]);
      }
    } catch (error) {
      console.error('워크플로우 큐를 가져오는 중 오류 발생:', error);
      alert('워크플로우 큐를 가져오는 중 오류가 발생했습니다.');
    }
  }, [API_BASE_URL, token]);

  useEffect(() => {
    fetchRobots();
  }, [fetchRobots]);

  const handleSelectRobot = (robot) => {
    setSelectedRobot(robot);
    setSelectedRobotId(robot._id); // 선택한 로봇의 _id 저장
    setName(robot.name);
    setDescription(robot.description);
    setIp(robot.ip); // IP 주소 상태 설정
    setActive(robot.active);
    setPendingWorkflowDeletions([]); // 이전 삭제 요청 초기화
    fetchWorkflowQueue(robot._id); // 작업 큐 불러오기
  };

  const handleToggleActive = async () => {
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/toggleActive/${selectedRobot._id}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchRobots(selectedRobot._id);
    } catch (error) {
      console.error('활성 상태를 전환하는 중 오류 발생:', error);
      alert('활성 상태를 전환하는 중 오류가 발생했습니다.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    // 이름 유효성 검사: 한글 입력 불가, 영문자, 숫자, 하이픈, 밑줄만 허용
    const nameRegex = /^[a-zA-Z0-9-_]+$/;
    if (!nameRegex.test(name)) {
      alert('Robot name must not contain Korean characters and should only include letters, numbers, hyphens, or underscores.');
      return;
    }

    // IP 주소 유효성 검사
    const ipRegex = /^(25[0-5]|2[0-4]\d|[0-1]?\d\d?)\.(25[0-5]|2[0-4]\d|[0-1]?\d\d?)\.(25[0-5]|2[0-4]\d|[0-1]?\d\d?)\.(25[0-5]|2[0-4]\d|[0-1]?\d\d?)$/;
    if (!ipRegex.test(ip)) {
      alert('유효한 IP 주소를 입력해주세요.');
      return;
    }

    setIsSaving(true); // Save 시작

    try {
      // 로봇 정보 업데이트
      await axios.put(`${API_BASE_URL}/update/${selectedRobot._id}`, {
        name,
        description,
        ip // IP 주소 포함
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // 워크플로우 삭제 요청
      if (pendingWorkflowDeletions.length > 0) {
        const deleteWorkflowPromises = pendingWorkflowDeletions.map(workflowId =>
          axios.delete(`${API_BASE_URL}/workflows/${workflowId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        );

        await Promise.all(deleteWorkflowPromises);
      }

      // 성공적으로 업데이트 및 삭제 후 데이터 재조회
      fetchRobots(selectedRobot._id);
      alert('로봇이 성공적으로 업데이트되었습니다.');
      setPendingWorkflowDeletions([]); // 삭제 대기 목록 초기화
    } catch (error) {
      console.error('로봇을 업데이트하는 중 오류 발생:', error);
      alert(`로봇을 업데이트하는 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false); // Save 종료
    }
  };

  // 플로팅 Delete 버튼 핸들러 (즉시 삭제)
  const handleDelete = async () => {
    if (selectedRobot) {
      const confirmDelete = window.confirm(`"${selectedRobot.name}" 로봇을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
      if (!confirmDelete) return;

      if (!token) {
        alert('토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      setIsSaving(true); // 삭제 진행 중 표시

      try {
        // DELETE 요청으로 API 호출
        await axios.delete(`${API_BASE_URL}/robots/${selectedRobot._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        alert('로봇이 성공적으로 삭제되었습니다.');
        // 로봇 목록에서 삭제된 로봇 제거
        setRobots((prevRobots) => prevRobots.filter((robot) => robot._id !== selectedRobot._id));
        // 선택된 로봇 초기화
        setSelectedRobot(null);
        setSelectedRobotId(null);
        setName('');
        setDescription('');
        setIp('');
        setActive(1);
        setWorkflowQueue([]);
        setPendingWorkflowDeletions([]); // 삭제 대기 목록 초기화
      } catch (error) {
        console.error('로봇을 삭제하는 중 오류 발생:', error);
        alert(`로봇을 삭제하는 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsSaving(false); // 삭제 종료
      }
    }
  };

  // 워크플로우 삭제 핸들러 (프론트엔드에서만 삭제하고 임시 저장)
  const handleDeleteWorkflow = (workflowId) => {
    if (window.confirm('임시로 삭제하시겠습니까? 저장 시 최종 반영됩니다.')) {
      // 워크플로우를 workflowQueue에서 제거
      setWorkflowQueue(prevQueue => prevQueue.filter(workflow => workflow._id !== workflowId));
      // 삭제 대기 목록에 워크플로우 ID 추가
      setPendingWorkflowDeletions(prev => [...prev, workflowId]);
    }
  };

  // "작동" 버튼 핸들러 함수
  const handleStartWorkflows = async () => {
    if (!selectedRobotId) {
      alert('로봇을 선택해주세요.');
      return;
    }

    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsStarting(true);

    try {
      // 1. 워크플로우 할당 API 호출
      const assignResponse = await axios.post(`${API_BASE_URL}/assignNextWorkflow`, {
        robotId: selectedRobotId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (assignResponse.status === 200) {
        alert('워크플로우가 성공적으로 할당되었습니다.');
        // 워크플로우 큐 재조회
        fetchWorkflowQueue(selectedRobotId);

        // 2. 로봇을 작업으로 이동시키는 API 호출
        const moveResponse = await axios.post(`${API_BASE_URL}/move-to-task`, {
          robotId: selectedRobotId
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (moveResponse.status === 200) {
          alert('로봇이 작업으로 이동되었습니다.');
          // 필요한 경우 추가적인 상태 업데이트 수행
          fetchRobots(selectedRobotId);
        } else {
          alert('로봇을 작업으로 이동하는 데 실패했습니다.');
        }
      } else {
        alert('할당할 워크플로우가 없습니다.');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        alert(`오류: ${error.response.data.error}`);
      } else {
        alert(`오류가 발생했습니다: ${error.message}`);
      }
      console.error('작동 중 오류:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const totalRobots = robots.length;
  const activeRobots = robots.filter(robot => robot.active === 1).length;

  // 이름 입력 시 한글 검증 로직 추가
  const handleNameChange = (e) => {
    const inputName = e.target.value;
    if (!/^[a-zA-Z0-9-_]*$/.test(inputName)) {
      alert('Robot name must not contain Korean characters and should only include letters, numbers, hyphens, or underscores.');
      return;
    }
    setName(inputName);
  };

  return (
    <div className="robot-edit-page">
    <header className="map-management-header">
        <div className="left-section">
            <Logo />
        </div>
        <div className="right-section">
            <UserInfo />
            <LogoutButton />
        </div>
    </header>
      <Navbar />
      <div className="main-content">
        <div className="robot-list-container">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={{ marginRight: '10px' }}>AMR</h3>
            <span style={{ fontSize: '18px', color: 'gray' }}>
              {activeRobots}/{totalRobots} Act
            </span>
            <button
              onClick={() => setShowRegisterModal(true)}
              style={{
                padding: '5px 10px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                marginLeft: 'auto'
              }}
              aria-label="Register New Robot"
            >
              +
            </button>
          </div>
          {loading ? (
            <p>로봇을 불러오는 중...</p>
          ) : (
            <ul className="robot-list">
              {robots.map((robot) => (
                <li
                  key={robot._id}
                  onClick={() => handleSelectRobot(robot)}
                  className={selectedRobotId === robot._id ? 'selected' : ''}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>
                    {robot.name} - {robot.ip}
                  </span>
                  <span style={{ color: 'gray', marginLeft: '10px' }}>
                    {robot.active === 1 ? 'Act' : 'Inact'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="robot-details-container">
          {selectedRobot ? (
            <form className="robot-form" onSubmit={handleUpdate}>
              <div className="robot-field">
                <label htmlFor="name"><strong>Name</strong></label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange} // 이름 변경 검증 로직
                  required
                  className="input-field"
                  placeholder="Enter robot name"
                  style={{ width: '50%' }}
                />
                <span style={{ marginLeft: '20px', fontWeight: 'bold' }}>
                  배터리 {selectedRobot.status?.battery || 0}%
                </span>
              </div>
              <div className="robot-field">
                <label htmlFor="description"><strong>설명</strong></label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  className="input-field"
                  placeholder="Enter robot description"
                />
              </div>
              <div className="robot-field">
                <label htmlFor="ip"><strong>IP 주소</strong></label>
                <input
                  id="ip"
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter robot IP address"
                  style={{ width: '10%' }}
                />
              </div>

              <div className="robot-info">
                <div>
                  <p><strong>모델</strong></p>
                  <p>{selectedRobot.model}</p>
                </div>
                <div>
                  <p><strong>상태</strong></p>
                  <p>{selectedRobot.status?.state || 'Unknown'}</p>
                </div>
                <div>
                  <p><strong>등록일</strong></p>
                  <p>{new Date(selectedRobot.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="robot-field">
                <label><strong>Active</strong></label>
                <div style={{ marginTop: '10px' }}>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={active === 1}
                      onChange={handleToggleActive}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              {/* 작업 플로우 디자인 - 첫번째 플로우는 "In Progress"이거나 공란 */}
              <div className="robot-flow-container">
                <div className="robot-flow-background">
                  <div className="robot-flow-list">
                    {workflowQueue.length > 0 ? (
                      workflowQueue.map((workflow, index) => (
                        <div
                          key={workflow.isPlaceholder ? 'placeholder' : workflow._id}
                          className={`robot-flow-item ${workflow.isPlaceholder ? 'placeholder' : ''}`}
                        >
                          {/* 첫 번째 플로우가 placeholder가 아닐 경우만 삭제 버튼 표시 */}
                          {index !== 0 && workflow && (
                            <button
                              onClick={() => handleDeleteWorkflow(workflow._id)}
                              className="delete-button"
                              title="Delete Workflow"
                              aria-label={`Delete workflow ${workflow.node} - ${workflow.step}`}
                            >
                              ×
                            </button>
                          )}
                          {/* 첫 번째 플로우가 placeholder일 경우 공란 유지 */}
                          {workflow.isPlaceholder ? (
                            <div className="workflow-details placeholder-details">
                              {/* 공란에 대한 추가 내용 또는 아이콘 */}
                              <span style={{ fontSize: '24px', color: '#ccc' }}> </span>
                            </div>
                          ) : (
                            <div className="workflow-details">
                              <strong>{workflow.node}</strong>
                              <div>{workflow.step}</div>
                              <div className={`workflow-status-${workflow.status.replace(' ', '-').toLowerCase()}`}>
                                {workflow.status}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No workflow steps assigned.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 추가적인 작업 플로우 기능을 원할 경우 여기에 구현 */}
            </form>
          ) : (
            <p>세부 정보를 보려면 로봇을 선택해주세요.</p>
          )}
        </div>
      </div>

      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => setShowRegisterModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer'
              }}
              aria-label="Close Modal"
            >
              &times;
            </button>
            <RobotRegisterPage onClose={() => { setShowRegisterModal(false); fetchRobots(); }} />
          </div>
        </div>
      )}

      {selectedRobot ? (
        <div className="floating-buttons">
          <button
            className="floating-delete-button"
            onClick={handleDelete}
            disabled={isSaving}
          >
            {isSaving ? 'Deleting...' : 'DELETE'}
          </button>
          <button
            className="floating-save-button"
            onClick={handleUpdate}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'SAVE'}
          </button>
          <button
            className="floating-start-button"
            onClick={handleStartWorkflows}
            disabled={isSaving || isStarting}
          >
            {isStarting ? '작동 중...' : '작동'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default RobotEditPage;
