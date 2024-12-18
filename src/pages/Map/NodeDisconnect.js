import React, { useEffect } from 'react';
import axios from 'axios';

function NodeDisconnect({ firstNodeId, secondNodeId, onDisconnectSuccess }) {
  useEffect(() => {
    if (firstNodeId && secondNodeId) {
      const disconnectNodes = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('토큰이 없습니다. 다시 로그인해주세요.');
          return;
        }

        try {
          await axios.delete(`http://13.209.28.158:5557/map/${firstNodeId}/connections/${secondNodeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
       
          
          // 연결 해제 성공 후 콜백 호출
          if (onDisconnectSuccess) {
            onDisconnectSuccess(true);
          }
        } catch (error) {
          console.error('노드 연결 해제 중 오류 발생:', error);
          alert('노드 연결 해제에 실패했습니다.');
          if (onDisconnectSuccess) {
            onDisconnectSuccess(false);
          }
        }
      };

      disconnectNodes();
    }
  }, [firstNodeId, secondNodeId, onDisconnectSuccess]);

  return null;
}

export default NodeDisconnect;
