import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch('http://3.35.87.118:5555/account/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, phone }),
        });

        if (response.ok) {
            navigate('/login');
        } else {
            const errorData = await response.json();
            alert(`Registration failed: ${errorData.message}`);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Register</h2>
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
                <label style={{ width: '100%', marginBottom: '10px' }}>
                    Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </label>
                <label style={{ width: '100%', marginBottom: '10px' }}>
                    Phone:
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </label>
                <button type="submit" style={{ padding: '10px 20px', margin: '10px 0', borderRadius: '5px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Register
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;

