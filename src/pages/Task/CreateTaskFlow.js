import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './CreateTaskFlow.css';

const mapResolution = 0.05;
const mapOrigin = [-10.0, -10.0];

const worldToMap = (worldX, worldY, imageNaturalWidth, imageNaturalHeight) => {
    const mapX = (worldX - mapOrigin[0]) / mapResolution;
    const mapY = imageNaturalHeight - (worldY - mapOrigin[1]) / mapResolution;
    return { x: mapX, y: mapY };
};

function CreateTaskFlow({ onClose, onTaskFlowAdd }) {
    const [selectedNode, setSelectedNode] = useState('');
    const [selectedStep, setSelectedStep] = useState('');
    const [nodes, setNodes] = useState([]);
    const [steps, setSteps] = useState([]);
    const [allSteps, setAllSteps] = useState([]);
    const [noGoZones, setNoGoZones] = useState([]); // 금지 구역 상태 추가
    const [mapImage, setMapImage] = useState(null);
    const canvasRef = useRef(null);
    const mapImageRef = useRef(null);
    const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
    const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
    const [monitoredMap, setMonitoredMap] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // 모니터링 중인 맵과 금지 구역, 노드를 불러오는 함수
    const fetchMonitoredMap = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://13.209.28.158:5557/map/monitored', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMonitoredMap(response.data);
            fetchNodes(response.data._id);
            loadMapImage(response.data._id);
            fetchNoGoZones(response.data._id); // 금지 구역 데이터도 함께 로드
        } catch (error) {
            console.error('모니터링 중인 맵을 가져오는 중 오류 발생:', error);
            alert('모니터링 중인 맵을 가져오는 데 실패했습니다.');
        }
    };

    // 금지 구역 데이터를 서버에서 불러오는 함수
    const fetchNoGoZones = async (mapId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://13.209.28.158:5557/map/no-go-zones/map/${mapId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNoGoZones(response.data);
        } catch (error) {
            console.error('금지 구역 정보를 가져오는 중 오류 발생:', error);
            alert('금지 구역 정보를 가져오는 데 실패했습니다.');
        }
    };

    // 전체 단계 리스트를 가져오는 함수
    const fetchAllSteps = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://13.209.28.158:5557/map/steps', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllSteps(response.data);
        } catch (error) {
            console.error('단계 정보를 가져오는 중 오류 발생:', error);
            alert('단계 정보를 가져오는 데 실패했습니다.');
        }
    };

    // 노드 리스트를 불러오는 함수
    const fetchNodes = async (mapId) => {
        try {
            const response = await axios.get(`http://13.209.28.158:5557/map/nodes/${mapId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setNodes(response.data);
        } catch (error) {
            console.error('노드를 가져오는 중 오류 발생:', error);
            alert('노드를 가져오는 데 실패했습니다.');
        }
    };

    // 맵 이미지를 로드하고 그리기
    const loadMapImage = async (mapId) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://13.209.28.158:5557/map/file/${mapId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const imageUrl = URL.createObjectURL(response.data);
            setMapImage(imageUrl);
        } catch (error) {
            console.error('맵 이미지를 가져오는 중 오류 발생:', error);
            alert('맵 이미지를 가져오는 데 실패했습니다.');
        }
    };

    // 선택된 노드가 변경될 때 해당 노드의 작업 단계를 업데이트
    useEffect(() => {
        if (selectedNode) {
            const node = nodes.find((n) => n.name === selectedNode);
            if (node) {
                const nodeTasks = node.tasks || [];
                const stepsWithNames = nodeTasks.map(taskId => {
                    const step = allSteps.find(s => s._id === taskId);
                    return step ? step.name : '';
                });
                setSteps(stepsWithNames);
            }
        } else {
            setSteps([]);
        }
    }, [selectedNode, nodes, allSteps]);

    // 맵 이미지를 캔버스에 로드하고 그리기
    const loadCanvasWithImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        mapImageRef.current = new Image();
        mapImageRef.current.src = mapImage;

        mapImageRef.current.onload = () => {
            const imgWidth = mapImageRef.current.width;
            const imgHeight = mapImageRef.current.height;
            setImageNaturalWidth(imgWidth);
            setImageNaturalHeight(imgHeight);

            canvas.width = imgWidth;
            canvas.height = imgHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(mapImageRef.current, 0, 0, imgWidth, imgHeight);
            drawMapElements();
        };
    };

    // 맵 요소(노드, 연결선, 금지 구역 등)를 그리는 함수
    const drawMapElements = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!canvas || !imageNaturalWidth || !imageNaturalHeight) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImageRef.current, 0, 0, imageNaturalWidth, imageNaturalHeight);

        drawConnections();
        drawNodes();
        drawNoGoZones(); // 금지 구역을 그리는 함수 호출
    };

    // 연결선을 그리는 함수
    const drawConnections = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        nodes.forEach((node) => {
            node.connections.forEach((connection) => {
                const connectedNode = nodes.find(n => n._id === connection.node);
                if (connectedNode) {
                    ctx.strokeStyle = 'blue';
                    ctx.lineWidth = 2;
                    ctx.beginPath();

                    const { x: startX, y: startY } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
                    ctx.moveTo(startX, startY);

                    if (connection.waypoints && connection.waypoints.length > 0) {
                        connection.waypoints.forEach((waypoint) => {
                            const { x, y } = worldToMap(waypoint.x, waypoint.y, imageNaturalWidth, imageNaturalHeight);
                            ctx.lineTo(x, y);
                        });
                    }

                    const { x: endX, y: endY } = worldToMap(connectedNode.x, connectedNode.y, imageNaturalWidth, imageNaturalHeight);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            });
        });
    };

    // 노드를 그리는 함수
    const drawNodes = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        nodes.forEach((node) => {
            const { x, y } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
            const size = 10;

            ctx.fillStyle = 'red';
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        });
    };

    // 금지 구역을 그리는 함수
    const drawNoGoZones = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        noGoZones.forEach((zone) => {
            const topLeft = worldToMap(zone.topLeft.x, zone.topLeft.y, imageNaturalWidth, imageNaturalHeight);
            const bottomRight = worldToMap(zone.bottomRight.x, zone.bottomRight.y, imageNaturalWidth, imageNaturalHeight);
            const width = bottomRight.x - topLeft.x;
            const height = bottomRight.y - topLeft.y;

            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(topLeft.x, topLeft.y, width, height);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(topLeft.x, topLeft.y, width, height);
        });
    };

    // 마우스 이동 시 노드 호버 상태 업데이트
    const handleMouseMove = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        let foundNode = null;
        nodes.forEach((node) => {
            const { x, y } = worldToMap(node.x, node.y, imageNaturalWidth, imageNaturalHeight);
            const size = 10;

            if (mouseX >= x - size / 2 && mouseX <= x + size / 2 && mouseY >= y - size / 2 && mouseY <= y + size / 2) {
                foundNode = node;
            }
        });

        setHoveredNode(foundNode);
        setTooltipPosition({ x: event.clientX, y: event.clientY });
    };

    // 초기 데이터 로드
    useEffect(() => {
        fetchMonitoredMap();
        fetchAllSteps();
    }, []);

    // 맵 이미지가 변경되거나 호버 상태가 변경될 때 캔버스 다시 그리기
    useEffect(() => {
        if (mapImage) {
            loadCanvasWithImage();
        }
    }, [mapImage, noGoZones, nodes, hoveredNode]); // noGoZones와 nodes를 의존성에 추가

    // 노드 선택 시 해당 노드의 작업 단계 업데이트
    useEffect(() => {
        if (selectedNode) {
            const node = nodes.find((n) => n.name === selectedNode);
            if (node) {
                const nodeTasks = node.tasks || [];
                const stepsWithNames = nodeTasks.map(taskId => {
                    const step = allSteps.find(s => s._id === taskId);
                    return step ? step.name : '';
                });
                setSteps(stepsWithNames);
            }
        } else {
            setSteps([]);
        }
    }, [selectedNode, nodes, allSteps]);

    // 수정된 handleSubmit 함수: 선택된 노드의 x, y 좌표도 함께 전달
    const handleSubmit = () => {
        const node = nodes.find((n) => n.name === selectedNode);
        if (node) {
            onTaskFlowAdd(selectedNode, selectedStep, node.x, node.y);
        } else {
            alert('노드를 선택해주세요.');
        }
    };

    return (
        <div className="create-task-flow-container">
            <div className="map-preview" onMouseMove={handleMouseMove}>
                <canvas
                    ref={canvasRef}
                    style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
                ></canvas>
            </div>

            <div className="task-flow-form">
                <h3>작업 플로우 추가</h3>
                <select
                    value={selectedNode}
                    onChange={(e) => setSelectedNode(e.target.value)}
                    style={{ marginBottom: '10px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                    <option value="">노드 선택</option>
                    {nodes.map((node) => (
                        <option key={node._id} value={node.name}>
                            {node.name}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedStep}
                    onChange={(e) => setSelectedStep(e.target.value)}
                    style={{ marginBottom: '10px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                    <option value="">단계 선택</option>
                    {steps.map((step, index) => (
                        <option key={index} value={step}>
                            {step}
                        </option>
                    ))}
                </select>
                <div className="buttons">
                    <button onClick={handleSubmit}>추가</button>
                    <button onClick={onClose}>취소</button>
                </div>
            </div>

            {hoveredNode && (
                <div
                    className="tooltip"
                    style={{
                        position: 'fixed',
                        top: `${tooltipPosition.y + 10}px`,
                        left: `${tooltipPosition.x + 10}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        fontSize: '12px',
                    }}
                >
                    {hoveredNode.name}
                </div>
            )}
        </div>
    );
}

export default CreateTaskFlow;
