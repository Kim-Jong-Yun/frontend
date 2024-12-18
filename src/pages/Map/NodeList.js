import React, { useState, useEffect } from 'react';
import './NodeList.css';
import { FaChevronUp, FaChevronDown, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import StepList from './StepList';

function NodeList({ mapId }) { // mapId를 prop으로 받음
  const [nodes, setNodes] = useState([]);
  const [expandedNodeIds, setExpandedNodeIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStepListPopupOpen, setIsStepListPopupOpen] = useState(false);
  const [stepList, setStepList] = useState([]);
  const [selectedStep, setSelectedStep] = useState('');
  const [token, setToken] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState(null);

  // 컴포넌트가 처음 렌더링될 때 토큰을 로컬 스토리지에서 가져옴
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error('No token found');
    }
  }, []);

  // 토큰과 mapId가 설정된 후 StepList와 Node 데이터를 가져옴
  useEffect(() => {
    if (token && mapId) { // mapId가 있는지 확인
      fetchStepList();
      fetchNodes(mapId); // mapId를 사용하여 노드를 가져옴
    }
  }, [token, mapId]);

  // StepList 데이터를 가져오는 함수
  const fetchStepList = async () => {
    try {
      const response = await axios.get('http://3.39.166.207:5557/map/steps', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStepList(response.data || []);
    } catch (error) {
      console.error('Error fetching step list:', error);
      setStepList([]);
    }
  };

  // Node 데이터를 특정 맵 ID로 필터링하여 가져오는 함수
  const fetchNodes = async (mapId) => {
    try {
      const response = await axios.get(`http://3.39.166.207:5557/map/nodes/${mapId}`, { // mapId를 포함한 URL로 변경
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNodes(response.data || []);
      console.log('Nodes fetched:', response.data);
    } catch (error) {
      console.error('Error fetching nodes:', error);
      setNodes([]);
    }
  };

  // 노드를 클릭할 때 펼치거나 접는 함수
  const toggleNodeDetails = (nodeId) => {
    if (expandedNodeIds.includes(nodeId)) {
      setExpandedNodeIds(expandedNodeIds.filter(id => id !== nodeId));
    } else {
      setExpandedNodeIds([...expandedNodeIds, nodeId]);
    }
  };

  // Step 추가 모달을 열고 현재 노드 ID 저장
  const handleOpenModal = (nodeId) => {
    setCurrentNodeId(nodeId);
    setIsModalOpen(true);
  };

  // 모달 닫기 함수
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStep('');
  };

  // 선택된 Step 변경 함수
  const handleStepChange = (e) => {
    setSelectedStep(e.target.value);
  };

  // Step을 해당 노드의 tasks에 추가하는 함수
  const handleAddStepToNode = async () => {
    if (!selectedStep || !currentNodeId) {
      alert('Step 또는 Node가 선택되지 않았습니다.');
      return;
    }

    try {
      const response = await axios.post(
        'http://3.39.166.207:5557/map/node/add-step', 
        {
          nodeId: currentNodeId,
          stepId: selectedStep
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Node updated with new step:', response.data.node);
      alert('Step이 노드에 추가되었습니다!');
      handleCloseModal();
      fetchNodes(mapId); // 노드 데이터 새로 고침
    } catch (error) {
      console.error('Step 추가 중 오류 발생:', error);
      alert('Step 추가 중 오류가 발생했습니다.');
    }
  };

  // stepId를 이용해 step name을 찾는 함수
  const getStepName = (stepId) => {
    const step = stepList.find((step) => step._id === stepId);
    return step ? step.name : 'Unknown Step';
  };

  // 스텝 리스트 관리 팝업 열기 함수
  const handleOpenStepListPopup = () => {
    setIsStepListPopupOpen(true);
  };

  // 스텝 리스트 관리 팝업 닫기 함수
  const handleCloseStepListPopup = () => {
    setIsStepListPopupOpen(false);
  };

  return (
    <div className="node-list-container">
      <div className="node-list-header">
        <h3>Nodes List</h3>
        {/* '스텝 리스트 관리' 버튼 */}
        <button className="step-list-manage-button" onClick={handleOpenStepListPopup}>
          스텝 관리
        </button>
      </div>

      {nodes.length > 0 ? (
        <ul>
          {nodes.map((node) => (
            <li key={node._id} className="node-list-item">
              <div className="node-header" onClick={() => toggleNodeDetails(node._id)}>
                <strong>{node.name}</strong>: ({node.x.toFixed(2)}, {node.y.toFixed(2)})
                {expandedNodeIds.includes(node._id) ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              <div className={`node-details-wrapper ${expandedNodeIds.includes(node._id) ? 'expanded' : 'collapsed'}`}>
                <div className="node-details">
                  <p><strong>Coordinates:</strong> ({node.x.toFixed(2)}, {node.y.toFixed(2)})</p>

                  {/* Step 추가 버튼 */}
                  <button className="add-step-button" onClick={() => handleOpenModal(node._id)}>
                    <FaPlus /> <span className="add-step-text">Step 추가</span>
                  </button>

                  {/* 해당 노드의 tasks 목록을 인라인으로 나열 */}
                  <div className="node-tasks-inline">
                    <h4>Tasks:</h4>
                    {node.tasks && node.tasks.length > 0 ? (
                      <span>
                        {node.tasks.map((task, index) => (
                          <span key={index} className="task-item">
                            {getStepName(task)}{index < node.tasks.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span>No tasks assigned yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No nodes available for this map.</p>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Step 추가</h2>
            {/* 드롭다운 리스트에서 Step 선택 */}
            <label htmlFor="stepSelect">Step을 선택하세요:</label>
            <select id="stepSelect" value={selectedStep} onChange={handleStepChange}>
              <option value="">Step을 선택하세요</option>
              {stepList.length > 0 && stepList.map((step) => (
                <option key={step._id} value={step._id}>
                  {step.name}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={handleAddStepToNode}>추가</button>
              <button onClick={handleCloseModal}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 스텝 리스트 관리 팝업 */}
      {isStepListPopupOpen && (
        <div className="modal">
          <div className="modal-content">
            <StepList />
            <button onClick={handleCloseStepListPopup}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NodeList;
