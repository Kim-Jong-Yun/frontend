import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Account/LoginPage';
import RegisterPage from './pages/Account/RegisterPage';
import MainPage from './pages/Main/MainPage';
import MonitorPage from './pages/Monitor/MonitoringPage';
import MapCreatePage from './pages/Map/MapCreatePage';
import MapUploadPage from './pages/Map/MapUploadPage';
import MapEditPage from './pages/Map/MapEditPage';
import RobotRegisterPage from './pages/Robot/RobotRegisterPage';
import RobotEditPage from './pages/Robot/RobotEditPage';
import Mapmanage from './pages/Map/Mapmanage';
import RobotManagePage from './pages/Robot/RobotManagePage';
import TestPage from './pages/Test/TestPage';
import TaskPage from './pages/Task/TaskPage';
import LogPage from './pages/Log/LogPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/main/*" element={<MainPage />} />
                <Route path="/monitor" element={<MonitorPage />} />
                <Route path="/map_create" element={<MapCreatePage />} />
                <Route path="/map_upload" element={<MapUploadPage />} />
                <Route path="/map_edit" element={<MapEditPage />} />
                <Route path="/robot_register" element={<RobotRegisterPage />} />
                <Route path="/robot_edit" element={<RobotEditPage />} />
                <Route path="/map_manage" element={<Mapmanage />} />
                <Route path="/robot_manage" element={<RobotManagePage />} />
                <Route path="/testpage" element={<TestPage />} />
                <Route path="/taskpage" element={<TaskPage />} />
                <Route path="/LogPage" element={<LogPage />} />
                <Route path="/" element={<LoginPage />} /> {/* 기본 경로는 로그인 페이지로 설정 */}
            </Routes>
        </Router>
    );
}

export default App;


