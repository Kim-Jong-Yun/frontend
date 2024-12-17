import React, { useState } from 'react';
import './Dashboard.css';
import logo from '../../assets/images/ketg.png'

// 개별 대시보드 컴포넌트
function IndividualDashboard() {
    const barChartData = [
        { label: '월요일', value: 120 },
        { label: '화요일', value: 150 },
        { label: '수요일', value: 200 },
        { label: '목요일', value: 180 },
        { label: '금요일', value: 160 }
    ];

    const lineChartData = [65, 59, 80, 81, 56, 55, 40];
    const pieChartData = [
        { label: '냉방', value: 30 },
        { label: '난방', value: 25 },
        { label: '조명', value: 20 },
        { label: '기타', value: 25 }
    ];

    const getPieOffset = (data, index) => {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        return data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 100, 0);
    };

    return (
        <div className="individual-dashboard">
            <h2>개별 대시보드</h2>
            <div className="dashboard-content">
                {/* 막대 차트 */}
                <div className="chart-container">
                    <h3>일별 에너지 사용량</h3>
                    <div className="bar-chart">
                        {barChartData.map((data, index) => (
                            <div key={index} className="bar" 
                                 style={{
                                     height: `${data.value / 2}px`, /* % 대신 px로 변경 */
                                     backgroundColor: `hsl(${index * 60}, 70%, 60%)`
                                 }}>
                                <span className="bar-label">{data.label}</span>
                                <span className="bar-value">{data.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 선형 차트 */}
                <div className="chart-container">
                    <h3>시간별 전력 소비 추이</h3>
                    <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                            fill="none"
                            stroke="#FFC107"
                            strokeWidth="2"
                            points={lineChartData.map((value, i) => 
                                `${(i / (lineChartData.length - 1)) * 100},${100 - value}`
                            ).join(' ')}
                        />
                    </svg>
                </div>

                {/* 파이 차트 */}
                <div className="chart-container">
                    <h3>에너지 소비 분포</h3>
                    <svg className="pie-chart" viewBox="0 0 100 100">
                        {pieChartData.map((slice, index) => (
                            <circle key={index} className="pie-slice"
                                cx="50" cy="50" r="45"
                                stroke={`hsl(${index * 90}, 70%, 60%)`}
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={`${(slice.value / 100) * 283} 283`}
                                strokeDashoffset={`-${getPieOffset(pieChartData, index) * 2.83}`}
                            />
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    const [activeTab, setActiveTab] = useState('종합 대시보드');

    // 임의 데이터
    const barChartData = [
        { label: 'A공정', value: 318304 },
        { label: 'B공정', value: 333655 },
        { label: 'C공정', value: 414512 },
    ];
    const lineChartData = [54, 57, 63, 45, 39, 49, 53, 44, 33, 38, 55];
    const tableData = [
        { device: '검침기기 1', value: 2850, unit: 'kW', status: '가동 중' },
        { device: '검침기기 2', value: 917, unit: 'kW', status: '가동 중' },
        { device: '검침기기 3', value: 2058, unit: 'kW', status: '가동 중' },
    ];
    const eventLogData = [
        { time: '16:39:31', description: '16시 에너지 사용량 0.512 발행' },
        { time: '16:37:22', description: '태그 기기의 이상감지(1건 발행)' },
        { time: '16:36:15', description: '16시 에너지 사용량 0.672 발행' },
        { time: '16:34:01', description: '태그 기기의 이상감지(2건 발행)' },
        { time: '16:30:59', description: '16시 에너지 사용량 0.702 발행' },
    ];

    // 퍼센테이지에 따른 각도 계산 (360도 기준)
    const calculateDegree = (percentage) => {
        return (percentage / 100) * 360;
    };

    const percentage = 89.46; // 예시 퍼센테이지 값
    const degree = calculateDegree(percentage); // 각도 계산

    // 메인 콘텐츠 렌더링 함수
    const renderMainContent = () => {
        switch(activeTab) {
            case '개별 대시보드':
                return <IndividualDashboard />;
            case '종합 대시보드':
                return (
                    <div className="dashboard-content">
                        <div className="card-grid">
                            <div className="card">
                                <h2>최대 수요전력</h2>
                                <div className="gauge-chart">
                                    <div 
                                        className="gauge" 
                                        style={{ 
                                            background: `conic-gradient(from 0deg, #FFC107 ${degree}deg, #3A4059 ${degree}deg)` 
                                        }}
                                    >
                                        <div className="gauge-cover">
                                            <span className="gauge-value">{percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <h2>누적 사용량(전력)</h2>
                                <p className="highlight">115,908 MWh</p>
                                <p>9,030 MWh (단월)</p>
                            </div>
                            <div className="card">
                                <h2>온실가스 누적 배출량</h2>
                                <p className="highlight">26,658.90 TOE</p>
                            </div>
                            <div className="card">
                                <h2>전력 소비 비용</h2>
                                <p className="highlight">45,372 천원</p>
                            </div>
                        </div>

                        <div className="chart-grid">
                            <div className="chart-card">
                                <h2>전력 사용량 추이</h2>
                                <div className="line-chart">
                                    {lineChartData.map((value, index) => (
                                        <div
                                            key={index}
                                            className="line-point"
                                            style={{
                                                left: `${index * 10}%`,
                                                bottom: `${value}%`,
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            <div className="chart-card">
                                <h2>공정별 에너지 소비</h2>
                                <div className="bar-chart">
                                    {barChartData.map((data, index) => (
                                        <div
                                            key={index}
                                            className="bar"
                                            style={{
                                                width: `${(data.value / 500000) * 100}%`,
                                            }}
                                        >
                                            <span>{data.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="horizontal-grid">
                            {/* 주요 검침현황 */}
                            <div className="table-container">
                                <h2>주요 검침현황</h2>
                                <table className="styled-table">
                                    <thead>
                                        <tr>
                                            <th>검침기기</th>
                                            <th>순시</th>
                                            <th>단위</th>
                                            <th>상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.device}</td>
                                                <td>{row.value}</td>
                                                <td>{row.unit}</td>
                                                <td>{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 이벤트/알람 이력 */}
                            <div className="event-log-container">
                                <h2>이벤트/알람 이력</h2>
                                <ul className="event-log">
                                    {eventLogData.map((event, index) => (
                                        <li key={index}>
                                            <span className="event-time">{event.time}</span>
                                            <span className="event-description">{event.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div>준비 중입니다.</div>;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* 좌측 네비게이션 바 */}
            <div className="sidebar">
                {/* 로고 이미지 추가 */}
                <div className="sidebar-header">
                    <img src={logo} alt="KETG Logo" className="logo" />
                    <h2>FEMS</h2>
                    <p className="admin-tag">개발자_관리자</p>
                </div>

                {/* 메뉴 */}
                <ul className="menu">
                    {['종합 대시보드', '개별 대시보드', '최대수요전력 관리', '검침 데이터 조회', '에너지 사용 요약', '에너지 사용량 조회', '공정별 에너지 사용량 비교'].map((item, index) => (
                        <li
                            key={index}
                            className={`menu-item ${activeTab === item ? 'active' : ''}`}
                            onClick={() => setActiveTab(item)}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="main-container">
                {/* 탭 바 */}
                <div className="tab-bar">
                    {/* 현재 활성 탭 제목 표시 */}
                    <h2>{activeTab}</h2>
                </div>

                {/* 메인 콘텐츠 렌더링 */}
                {renderMainContent()}
            </div>

        </div >
    );
}

export default Dashboard;
