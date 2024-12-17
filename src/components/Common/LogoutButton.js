import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <button 
            onClick={handleLogout}
            style={{
                padding: '10px 20px',
                margin: '10px 0',
                borderRadius: '5px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
            }}
        >
            Logout
        </button>
    );
}

export default LogoutButton;

