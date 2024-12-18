import React from 'react';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import Logo from '../../components/Common/Logo';

function MainPage() {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
            <header className="map-management-header">
        <div className="left-section">
            <Logo />
        </div>
        <div className="right-section">
            <UserInfo />
            <LogoutButton />
        </div>
    </header>
        
                <Navbar />
            </div>
        
    );
}

export default MainPage;
