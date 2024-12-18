// pages/LogPage/LogPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import Logo from '../../components/Common/Logo';
import './LogPage.css'; // CSS 파일 임포트

function LogPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [logTypes, setLogTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(50); // 한 페이지당 로그 개수
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 서버에서 로그 데이터 가져오기
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('토큰이 없습니다. 다시 로그인해주세요.');
        window.location.href = '/login';
        return;
      }

      const response = await axios.get('http://3.39.166.207:8080/task/logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1, // 초기 로딩 시 모든 데이터를 가져오기 위해 페이지를 1로 설정
          limit: 1000, // 충분히 큰 limit을 설정하여 모든 데이터를 한 번에 가져옵니다.
        },
      });

      if (response.data.success) {
        setLogs(response.data.data);
        setFilteredLogs(response.data.data);
        setPages(Math.ceil(response.data.data.length / limit));

        // 로그 상태 추출 및 'Error' 상태 추가
        const types = [...new Set(response.data.data.map((log) => log.status))];
        if (!types.includes('Error')) {
          types.push('Error'); // 'Error' 상태가 없다면 추가
        }
        setLogTypes(types);
        setSelectedTypes(types); // 기본적으로 모든 상태 선택
      } else {
        console.error('로그 데이터를 가져오는 중 오류 발생:', response.data.message);
        setError(response.data.message || '로그 데이터를 가져오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('로그 데이터를 가져오는 중 오류 발생:', error);
      setError('로그 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 클라이언트 사이드 필터링 적용
  const applyFilters = () => {
    let tempLogs = [...logs];

    // 로그 상태 필터링
    if (selectedTypes.length > 0) {
      tempLogs = tempLogs.filter((log) => selectedTypes.includes(log.status));
    }

    // 날짜 범위 필터링
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      tempLogs = tempLogs.filter((log) => new Date(log.timestamp) >= fromDate);
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      tempLogs = tempLogs.filter((log) => new Date(log.timestamp) <= toDate);
    }

    // 검색어 필터링
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      tempLogs = tempLogs.filter((log) =>
        regex.test(log.robotName) ||
        regex.test(log.robotIp) ||
        regex.test(log.nodeName) ||
        regex.test(log.step) ||
        regex.test(log.status)
      );
    }

    setFilteredLogs(tempLogs);
    setPages(Math.ceil(tempLogs.length / limit));
    setPage(1); // 필터 적용 시 페이지를 첫 페이지로 초기화
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    fetchLogs();
  };

  // 필터 상태가 변경될 때마다 필터 적용
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, dateRange, searchTerm]);

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터링 옵션 변경 핸들러
  const handleTypeChange = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
    }
  };

  // 현재 페이지에 표시할 로그 데이터 계산
  const indexOfLastLog = page * limit;
  const indexOfFirstLog = indexOfLastLog - limit;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  return (
    <div className="log-page-container">
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

      <div className="log-content">
        {/* 좌측 필터 패널 */}
        <div className="log-filters">
          {/* 새로고침 버튼 추가 */}
          <div className="refresh-button-container">
            <button onClick={handleRefresh}>
              새로고침
            </button>
          </div>

          <div className="filter-section">
            <h5>로그 상태</h5>
            {logTypes.map((type) => (
              <label key={type} className="filter-label">
                <span className="status-text">{type}</span>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeChange(type)}
                />
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h5>날짜 범위</h5>
            <label>
              시작:
              <input
                type="date"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
              />
            </label>
            <label>
              종료:
              <input
                type="date"
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
              />
            </label>
          </div>

          <div className="filter-section">
            <h5>검색</h5>
            <input
              type="text"
              placeholder="로봇 이름, IP, 노드 이름, 단계 검색"
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </div>

        {/* 우측 로그 표시 패널 */}
        <div className="log-display">
          <h3>로그 목록</h3>
          {loading ? (
            <p>로딩 중...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : filteredLogs.length > 0 ? (
            <div className="log-display-content">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>로봇 이름</th>
                    <th>로봇 IP</th>
                    <th>노드 이름</th>
                    <th>단계</th>
                    <th>상태</th>
                    <th>타임스탬프</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.robotName}</td>
                      <td>{log.robotIp}</td>
                      <td>{log.nodeName}</td>
                      <td>{log.step}</td>
                      <td>{log.status}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 페이징 컨트롤 */}
              <div className="paging-controls">
                <button 
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page === 1}
                >
                  이전
                </button>
                <span>페이지 {page} / {pages}</span>
                <button 
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={page === pages}
                >
                  다음
                </button>
              </div>
            </div>
          ) : (
            <p>로그가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogPage;
