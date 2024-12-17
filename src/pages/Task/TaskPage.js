import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import CreateTask from './CreateTask';
import TaskFlow from './TaskFlow';
import './TaskPage.css';

function TaskPage() {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [assignPopupOpen, setAssignPopupOpen] = useState(false);
    const [temporaryWorkflow, setTemporaryWorkflow] = useState([]);
    const [deletedWorkflowNodes, setDeletedWorkflowNodes] = useState([]);
    const [monitoredMapName, setMonitoredMapName] = useState('');
    const taskFlowRef = useRef(null);

    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskType, setTaskType] = useState('A');
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchTasks();
        fetchMonitoredMapName();
    }, [token]);

    const fetchMonitoredMapName = async () => {
        try {
            const mapResponse = await axios.get('http://3.35.87.118:5557/map/monitored', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const monitoredMapData = mapResponse.data;
            if (monitoredMapData && monitoredMapData.name) {
                setMonitoredMapName(monitoredMapData.name);
            } else {
                setMonitoredMapName('맵 정보 없음');
            }
        } catch (error) {
            console.error('모니터링 중인 맵 정보를 가져오는 중 오류가 발생했습니다:', error);
            setMonitoredMapName('오류 발생');
        }
    };

    const fetchTasks = async () => {
        try {
            const mapResponse = await axios.get('http://3.35.87.118:5557/map/monitored', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const monitoredMapData = mapResponse.data;
            if (!monitoredMapData || !monitoredMapData._id) {
                console.error('모니터링 중인 맵 정보가 없습니다.');
                return;
            }

            const taskResponse = await axios.get(`http://3.35.87.118:8080/task/tasks?mapId=${monitoredMapData._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTasks(taskResponse.data);
            if (taskResponse.data.length > 0) handleTaskClick(taskResponse.data[0]);
        } catch (error) {
            console.error('작업 리스트를 가져오는 중 오류가 발생했습니다.', error);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setTaskName(task.name);
        setTaskDescription(task.description || '');
        setTaskType(task.taskType || 'A');
        setTemporaryWorkflow([]);
        setDeletedWorkflowNodes([]);

        if (taskFlowRef.current) {
            taskFlowRef.current.clearTemporaryWorkflow();
        }
    };

    const togglePopup = () => setIsPopupOpen((prev) => !prev);
    const toggleAssignPopup = () => setAssignPopupOpen((prev) => !prev);

    const handleTaskCreated = (newTask) => {
        setTasks((prevTasks) => [...prevTasks, newTask]);
        handleTaskClick(newTask);
    };

    const handleSaveTask = async () => {
        if (!selectedTask) {
            alert('저장할 작업을 선택하세요.');
            return;
        }

        // 업데이트된 작업 데이터 로그
        const updatedTask = {
            ...selectedTask,
            workflow: [...selectedTask.workflow, ...temporaryWorkflow],
            name: taskName,
            description: taskDescription,
            taskType: taskType,
        };
        console.log('Saving updated task:', updatedTask);

        // 워크플로우의 모든 단계에 x와 y가 있는지 검증
        for (const [index, step] of updatedTask.workflow.entries()) {
            if (step.x === undefined || step.y === undefined) {
                console.error(`Workflow step at index ${index} is missing x or y:`, step);
                alert(`워크플로우 단계 ${index + 1}에 x와 y 좌표가 필요합니다.`);
                return;
            }
        }

        try {
            await axios.put(`http://3.35.87.118:8080/task/tasks/${selectedTask._id}`, updatedTask, {
                headers: { Authorization: `Bearer ${token}` },
            });

            for (const { taskId, nodeId } of deletedWorkflowNodes) {
                await axios.put(
                    `http://3.35.87.118:8080/task/tasks/${taskId}/workflow/${nodeId}/nodeToZero`,
                    null,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            setTemporaryWorkflow([]);
            setDeletedWorkflowNodes([]);
            if (taskFlowRef.current) {
                taskFlowRef.current.clearTemporaryWorkflow();
            }

            alert('작업이 성공적으로 저장되었습니다.');
            await fetchTasks();

            const updatedTasks = await axios.get(`http://3.35.87.118:8080/task/tasks?mapId=${selectedTask.mapId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const savedTask = updatedTasks.data.find((task) => task._id === selectedTask._id);
            if (savedTask) handleTaskClick(savedTask);

        } catch (error) {
            console.error('작업 저장 중 오류가 발생했습니다.', error);
            alert('작업 저장 중 오류가 발생했습니다.');
        }
    };

    const handleTemporaryFlowAdd = (newFlow) => {
        // 플로우 추가 로그
        console.log('Adding temporary workflow:', newFlow);

        // x와 y 값 검증
        if (newFlow.x === undefined || newFlow.y === undefined) {
            console.error('Invalid workflow data: x or y is missing', newFlow);
            alert('워크플로우 추가 시 x와 y 좌표가 필요합니다.');
            return;
        }

        setTemporaryWorkflow((prev) => [...prev, newFlow]);
    };

    const handleTemporaryFlowDelete = (taskId, flowId) => {
        // 플로우 삭제 로그
        console.log('Deleting workflow node:', { taskId, flowId });
        setDeletedWorkflowNodes((prev) => [...prev, { taskId, nodeId: flowId }]);
    };

    const handleDeleteTask = async () => {
        if (!selectedTask) {
            alert('삭제할 작업을 선택하세요.');
            return;
        }

        const confirmDelete = window.confirm('정말로 이 작업을 삭제하시겠습니까?');
        if (!confirmDelete) return;

        try {
            await axios.put(`http://3.35.87.118:8080/task/tasks/${selectedTask._id}/delete`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const updatedTasks = tasks.filter((task) => task._id !== selectedTask._id);
            setTasks(updatedTasks);

            if (updatedTasks.length > 0) {
                handleTaskClick(updatedTasks[0]);
            } else {
                setSelectedTask(null);
                setTaskName('');
                setTaskDescription('');
                setTaskType('A');
                setTemporaryWorkflow([]);
                setDeletedWorkflowNodes([]);
            }

            alert('작업이 성공적으로 삭제되었습니다.');
        } catch (error) {
            console.error('작업 삭제 중 오류가 발생했습니다.', error);
            alert('작업 삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="page-container">
            <header className="header">
                <UserInfo />
                <LogoutButton />
            </header>
            <Navbar className="navbar" />
            <div className="main-content">
                <div className="task-list">
                    <div className="task-list-header">
                        <h3>작업 리스트 - {monitoredMapName}</h3>
                        <button className="add-task-btn" onClick={togglePopup}>+</button>
                    </div>
                    <ul>
                        {tasks.map((task) => (
                            <li
                                key={task._id}
                                onClick={() => handleTaskClick(task)}
                                className={selectedTask && selectedTask._id === task._id ? 'selected' : ''}
                            >
                                {task.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="task-details">
                    {selectedTask ? (
                        <div>
                            <h3>작업 상세 정보</h3>
                            <label>
                                <strong>작업 이름:</strong>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                />
                            </label>
                            <br />
                            <label>
                                <strong>작업 설명:</strong>
                                <textarea
                                    className="textarea-field"
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                />
                            </label>
                            <br />
                            <div className="task-row">
                                <label>
                                    <strong>작업 유형:</strong>
                                    <select
                                        className="select-field"
                                        value={taskType}
                                        onChange={(e) => setTaskType(e.target.value)}
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                </label>
                            </div>

                            <h4>작업 플로우</h4>
                            <div className="task-flow-section">
                                <TaskFlow
                                    ref={taskFlowRef}
                                    taskId={selectedTask._id}
                                    workflow={selectedTask.workflow}
                                    onTemporaryFlowAdd={handleTemporaryFlowAdd}
                                    onTemporaryFlowDelete={handleTemporaryFlowDelete}
                                />
                            </div>
                        </div>
                    ) : (
                        <p>작업을 선택하세요.</p>
                    )}
                </div>

                {isPopupOpen && (
                    <CreateTask onClose={togglePopup} onTaskCreated={handleTaskCreated} />
                )}

                {assignPopupOpen && selectedTask && (
                    <AssignTaskPopup onClose={toggleAssignPopup} selectedTask={selectedTask} />
                )}

                <div className="floating-buttons">
                    <button className="assign-task-btn" onClick={toggleAssignPopup}>작업 할당</button>
                    <button className="save-task-btn" onClick={handleSaveTask}>작업 저장</button>
                    <button className="delete-task-btn" onClick={handleDeleteTask}>작업 삭제</button>
                </div>
            </div>
        </div>
    );
}

function AssignTaskPopup({ onClose, selectedTask }) {
    const [robots, setRobots] = useState([]);
    const [selectedRobot, setSelectedRobot] = useState('');

    useEffect(() => {
        const fetchActiveRobots = async () => {
            try {
                const response = await axios.get('http://3.35.87.118:5559/robot/robots/active', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setRobots(response.data);
            } catch (error) {
                console.error('Active 상태의 로봇을 불러오는 중 오류가 발생했습니다:', error);
            }
        };

        fetchActiveRobots();
    }, []);

    const handleRobotSelect = (e) => {
        setSelectedRobot(e.target.value);
    };

    const handleAssign = async () => {
        if (!selectedRobot) {
            alert('할당할 로봇을 선택하세요.');
            return;
        }

        if (!selectedTask || !selectedTask.workflow) {
            alert('유효하지 않은 작업 또는 작업 플로우가 없습니다.');
            return;
        }

        try {
            for (const flow of selectedTask.workflow) {
                // x와 y를 포함하여 전송하도록 수정 (필요 시 주석 해제)
                await axios.post(
                    'http://3.35.87.118:5559/robot/addWorkflow',
                    {
                        robotId: selectedRobot,
                        node: flow.node,
                        step: flow.step,
                        x: flow.x, // x 좌표 추가
                        y: flow.y, // y 좌표 추가
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }
            alert(`로봇 ${selectedRobot}에 작업이 성공적으로 할당되었습니다.`);
            onClose(); // 할당 후 팝업 닫기
        } catch (error) {
            console.error('작업 할당 중 오류가 발생했습니다:', error);
            alert('작업 할당에 실패했습니다.');
        }
    };

    return (
        <div className="assign-popup">
            <div className="popup-content">
                <h3>작업 할당</h3>
                <label>
                    <strong>로봇 선택:</strong>
                    <select value={selectedRobot} onChange={handleRobotSelect}>
                        <option value="" disabled>로봇을 선택하세요</option>
                        {robots.map((robot) => (
                            <option key={robot._id} value={robot._id}>
                                {robot.name}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="popup-buttons">
                    <button onClick={handleAssign}>할당</button>
                    <button onClick={onClose}>닫기</button>
                </div>
            </div>
        </div>
    );
}

export default TaskPage;
