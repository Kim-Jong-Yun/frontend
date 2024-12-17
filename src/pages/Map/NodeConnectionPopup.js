// src/components/MapManage/NodeConnectionPopup.js

import React from 'react';
import './NodeConnectionPopup.css';

function NodeConnectionPopup({ onClose, onCreate, connectionData, setSelectionMode }) {
  const handleCreate = () => {
    if (!connectionData.node1 || !connectionData.node2) {
      alert('노드 1과 노드 2를 모두 선택해주세요.');
      return;
    }
    onCreate(connectionData);
  };

  const handleSetNode1 = () => {
    setSelectionMode('selectingNode1');
    alert('맵을 클릭하여 노드 1을 선택하세요.');
  };

  const handleSetNode2 = () => {
    setSelectionMode('selectingNode2');
    alert('맵을 클릭하여 노드 2를 선택하세요.');
  };

  const handleAddWaypoint = () => {
    setSelectionMode('selectingWaypoint');
    alert('맵을 클릭하여 웨이포인트를 추가하세요.');
  };

  const handleRemoveWaypoint = (index) => {
    const updatedWaypoints = [...connectionData.waypoints];
    updatedWaypoints.splice(index, 1);
    onCreate({ ...connectionData, waypoints: updatedWaypoints });
  };

  const handleSetWaypoint = (index) => {
    setSelectionMode(`selectingWaypoint_${index}`);
    alert(`맵을 클릭하여 웨이포인트 ${index + 1}을 선택하세요.`);
  };

  return (
    <div className="slide-overlay">
      <div className="node-connection-slide-panel">
        <h3>노드 연결 설정</h3>

        <div className="input-group">
          <label>노드 1</label>
          <div className="coordinate-input">
            <input
              type="text"
              readOnly
              value={connectionData.node1 ? connectionData.node1.name : '선택하세요'}
            />
            <button onClick={handleSetNode1}>set</button>
          </div>
        </div>

        <div className="input-group">
          <label>노드 2</label>
          <div className="coordinate-input">
            <input
              type="text"
              readOnly
              value={connectionData.node2 ? connectionData.node2.name : '선택하세요'}
            />
            <button onClick={handleSetNode2}>set</button>
          </div>
        </div>

        <h4>경유지 (웨이포인트)</h4>
        {connectionData.waypoints.map((wp, index) => (
          <div key={index} className="waypoint-input-group">
            <label>웨이포인트 {index + 1}</label>
            <div className="coordinate-input">
              <input
                type="text"
                readOnly
                value={
                  wp.x !== null && wp.y !== null
                    ? `X: ${wp.x.toFixed(2)}, Y: ${wp.y.toFixed(2)}`
                    : '선택하세요'
                }
              />
              {/* 웨이포인트를 설정하는 버튼을 추가하려면 아래 버튼을 사용할 수 있습니다.
              <button onClick={() => handleSetWaypoint(index)}>set</button> 
              */}
            </div>
            {/* 마이너스 버튼 클릭 시 이벤트 전파 중단 */}
            <button
              className="remove-btn"
              onClick={(e) => {
                e.stopPropagation(); // 이벤트 전파 중단
                handleRemoveWaypoint(index);
              }}
            >
              -
            </button>
          </div>
        ))}
        <button
          className="add-btn"
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 전파 중단
            handleAddWaypoint();
          }}
        >
          +
        </button>

        {/* 생성 및 취소 버튼 */}
        <div className="button-group">
          <button className="create-btn" onClick={(e) => { e.stopPropagation(); handleCreate(); }}>
            생성
          </button>
          <button
            className="cancel-btn"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeConnectionPopup;
