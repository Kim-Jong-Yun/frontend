import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateTask.css'; // 스타일을 위한 CSS 파일을 임포트

function CreateTask({ onClose, onTaskCreated }) {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState(''); // 작업 설명 상태 추가
    const [monitoredMapId, setMonitoredMapId] = useState(null); // 모니터링 중인 맵 ID

    // JWT 토큰을 localStorage에서 가져옴
    const token = localStorage.getItem('token');

    // 모니터링 중인 맵 정보 가져오기
    useEffect(() => {
        async function fetchMonitoredMap() {
            try {
                const response = await axios.get('http://13.209.28.158:5557/map/monitored', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMonitoredMapId(response.data._id); // 모니터링 중인 맵의 ID 저장
            } catch (error) {
                console.error('모니터링 중인 맵 정보를 가져오는 중 오류가 발생했습니다.', error);
            }
        }
        fetchMonitoredMap();
    }, [token]);

    // 작업 생성 핸들러
    const handleCreateTask = async () => {
        if (!taskName || !monitoredMapId) {
            alert('작업 이름과 맵 정보는 필수 항목입니다.');
            return;
        }

        try {
            // 작업 생성 API 요청
            const response = await axios.post('http://13.209.28.158:8080/task/tasks', {
                name: taskName,
                description: taskDescription,
                mapId: monitoredMapId, // 모니터링 중인 맵 ID를 포함
            }, {
                headers: { Authorization: `Bearer ${token}` }, // 토큰을 Authorization 헤더에 추가
            });

            onTaskCreated(response.data); // 새로운 작업을 부모 컴포넌트로 전달
            onClose(); // 팝업 닫기
        } catch (error) {
            console.error('작업 생성 중 오류가 발생했습니다.', error);
        }
    };

    return (
        <div className="create-task-popup">
            <div className="create-task-content">
                <h3>새 작업 추가</h3>
                <input
                    type="text"
                    placeholder="작업 이름"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                />
                <textarea
                    placeholder="작업 설명"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                />
                <div className="buttons">
                    <button onClick={handleCreateTask}>생성</button>
                    <button onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
}

export default CreateTask;
