import React, { useEffect, useState } from 'react';

function UserInfo() {
    const [name, setName] = useState('');

    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch('http://3.39.166.207:5555/account/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setName(data.name);
                }
            }
        };

        fetchUserInfo();
    }, []);

    return (
        <div style={{ padding: '10px 20px', backgroundColor: '#eee', borderRadius: '5px', marginBottom: '10px' }}>
            {name}
        </div>
    );
}

export default UserInfo;
