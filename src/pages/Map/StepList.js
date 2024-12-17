import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StepList.css';

function StepList() {
  const [taskName, setTaskName] = useState(''); // 스텝 이름 상태
  const [tasks, setTasks] = useState([]); // 스텝 목록 상태
  const [error, setError] = useState(''); // 오류 상태
  const [loading, setLoading] = useState(true); // 로딩 상태

  // 초기 스텝 목록 불러오기
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token'); // 로컬 스토리지에서 인증 토큰을 가져옴
        
        if (!token) {
          setError('인증 토큰이 없습니다. 다시 로그인하세요.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://3.35.87.118:5557/map/steps', {
          headers: {
            'Authorization': `Bearer ${token}` // Bearer 토큰을 헤더에 추가
          }
        });

        setTasks(response.data); // 가져온 스텝 목록을 상태에 저장
        setLoading(false); // 로딩 완료
      } catch (error) {
        console.error('스텝 목록을 불러오는 중 오류가 발생했습니다:', error);
        setError('스텝 목록을 불러오는 중 오류가 발생했습니다.');
        setLoading(false); // 로딩 완료
      }
    };

    fetchTasks();
  }, []); // 컴포넌트가 처음 렌더링될 때 한 번만 실행

  // 스텝 제거 함수
  const removeStep = async (stepId) => {
    const confirmRemove = window.confirm('이 스텝을 제거하시겠습니까?');

    if (!confirmRemove) return;

    try {
      const token = localStorage.getItem('token'); // 인증 토큰 가져오기
      await axios.put('http://3.35.87.118:5557/map/remove-step', { stepId }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // 성공적으로 제거 후, 목록에서 해당 스텝을 제거
      setTasks(tasks.filter((task) => task._id !== stepId));
    } catch (error) {
      console.error('스텝 제거 중 오류가 발생했습니다:', error);
      setError('스텝 제거 중 오류가 발생했습니다.');
    }
  };

  // 스텝 추가 함수
  const addTask = async () => {
    if (taskName.trim() === '') {
      setError('스텝 이름을 입력하세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // 로컬 스토리지에서 인증 토큰을 가져옴
      const response = await axios.post('http://3.35.87.118:5557/map/steps', { name: taskName }, {
        headers: {
          'Authorization': `Bearer ${token}` // 인증 토큰 추가
        }
      });
      setTasks([...tasks, response.data.step]); // 새로 추가된 스텝을 상태에 추가
      setTaskName(''); // 입력 필드 초기화
      setError(''); // 오류 메시지 초기화
    } catch (error) {
      setError('스텝 추가 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <div className="step-list-popup">
      <h2>스텝 리스트 관리</h2>
      <input 
        type="text" 
        value={taskName} 
        onChange={(e) => setTaskName(e.target.value)} 
        placeholder="스텝 이름을 입력하세요" 
        style={{ marginRight: '10px' }}
      />
      <button onClick={addTask}>추가</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>스텝 목록</h3>
      {loading ? (
        <p>스텝 목록을 불러오는 중입니다...</p>
      ) : (
        <ul className="step-list-scrollable">
          {tasks.map((task) => (
            <li key={task._id} className="step-item">
              {task.name}
              <span 
                onClick={() => removeStep(task._id)} 
                style={{ color: 'red', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold' }}>
                X
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StepList;
