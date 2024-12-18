import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LogPage() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('http://13.209.28.158:5559/logs');
                setLogs(response.data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div>
            <h2>Log Page</h2>
            <ul>
                {logs.map(log => (
                    <li key={log.id}>
                        {log.timestamp}: {log.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default LogPage;
