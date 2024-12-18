import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ControlPage() {
    const [robots, setRobots] = useState([]);
    const [selectedRobot, setSelectedRobot] = useState(null);
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchRobots = async () => {
            try {
                const response = await axios.get('http://13.209.28.158:5559/robots');
                setRobots(response.data);
            } catch (error) {
                console.error('Error fetching robots:', error);
            }
        };

        fetchRobots();
    }, []);

    const handleRobotSelect = (robot) => {
        setSelectedRobot(robot);
    };

    const handleMoveRobot = async () => {
        if (selectedRobot) {
            try {
                const response = await axios.post(`http://13.209.28.158:5559/robots/control/${selectedRobot.id}`, {
                    position: targetPosition
                });
                if (response.status === 200) {
                    alert('Robot moved successfully');
                }
            } catch (error) {
                console.error('Error moving robot:', error);
            }
        }
    };

    return (
        <div>
            <h2>Control Page</h2>
            <ul>
                {robots.map(robot => (
                    <li key={robot.id} onClick={() => handleRobotSelect(robot)}>
                        {robot.name}
                    </li>
                ))}
            </ul>
            {selectedRobot && (
                <div>
                    <h3>Move Robot: {selectedRobot.name}</h3>
                    <input
                        type="number"
                        placeholder="X position"
                        value={targetPosition.x}
                        onChange={e => setTargetPosition({ ...targetPosition, x: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Y position"
                        value={targetPosition.y}
                        onChange={e => setTargetPosition({ ...targetPosition, y: e.target.value })}
                    />
                    <button onClick={handleMoveRobot}>Move Robot</button>
                </div>
            )}
        </div>
    );
}

export default ControlPage;

