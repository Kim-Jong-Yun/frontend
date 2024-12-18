import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch('http://13.209.28.158:5555/account/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            navigate('/testpage');
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Login</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
                <label style={{ width: '100%', marginBottom: '10px' }}>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </label>
                <label style={{ width: '100%', marginBottom: '10px' }}>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </label>
                <button type="submit" style={{ padding: '10px 20px', margin: '10px 0', borderRadius: '5px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Login
                </button>
                <button type="button" onClick={() => navigate('/register')} style={{ padding: '10px 20px', margin: '10px 0', borderRadius: '5px', backgroundColor: '#008CBA', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Register
                </button>
            </form>
        </div>
    );
}

export default LoginPage;
