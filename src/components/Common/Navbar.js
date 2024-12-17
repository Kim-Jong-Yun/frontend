import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    const location = useLocation(); // 현재 경로 가져오기

    return (
        <nav>
            <ul>
                <li className={location.pathname === '/testpage' ? 'selected' : ''}>
                    <Link to="/testpage">모니터링</Link>
                </li>
                <li className={location.pathname === '/robot_edit' ? 'selected' : ''}>
                    <Link to="/robot_edit">AMR 관리</Link>
                </li>
                <li className={location.pathname === '/taskpage' ? 'selected' : ''}>
                    <Link to="/taskpage">작업 관리</Link>
                </li>
                <li className={location.pathname === '/map_manage' ? 'selected' : ''}>
                    <Link to="/map_manage">맵 관리</Link>
                </li>
                <li className={location.pathname === '/robot_manage' ? 'selected' : ''}>
                    <Link to="/robot_manage">테스트</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;
