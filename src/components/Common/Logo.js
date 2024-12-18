import React from 'react';
import logo from '../../assets/images/ketg2.png'; // 로컬 이미지 경로

function Logo() {
    return (
        <div style={styles.container}>
            <img src={logo} alt="Logo" style={styles.logo} />
        </div>
    );
}

// 인라인 스타일
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
    },
    logo: {
        width: '150px',     // 로고 너비 설정
        height: 'auto',     // 비율 유지
    },
};

export default Logo;
