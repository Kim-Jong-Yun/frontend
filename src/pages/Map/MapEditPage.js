import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import axios from 'axios';

function MapEditPage() {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMonitored, setIsMonitored] = useState(false);

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('No token found, please log in again.');
      return;
    }

    try {
      const response = await axios.get('http://3.35.87.118:5557/map/maps', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMaps(response.data);
    } catch (error) {
      console.error('Error fetching maps:', error);
    }
  };

  const handleSelectMap = (map) => {
    setSelectedMap(map);
    setName(map.name);
    setDescription(map.description);
    setIsMonitored(map.isMonitored || false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (name.length < 2) {
      alert('Map name must be at least 2 characters long');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      alert('No token found, please log in again.');
      return;
    }

    try {
      await axios.put(`http://3.35.87.118:5557/map/update/${selectedMap._id}`, {
        name,
        description,
        isMonitored
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Map updated successfully');
      fetchMaps();
    } catch (error) {
      console.error('Error updating map:', error);
      alert(`Error updating map: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSendMap = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('No token found, please log in again.');
      return;
    }

    try {
      await axios.post('http://3.35.87.118:5559/robot/send_map', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Map sent to robots successfully');
    } catch (error) {
      console.error('Error sending map to robots:', error);
      alert(`Error sending map to robots: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteMap = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('No token found, please log in again.');
      return;
    }

    if (!selectedMap) {
      alert('Please select a map first.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete the map "${selectedMap.name}"?`);

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.put(`http://3.35.87.118:5557/map/delete/${selectedMap._id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Map deleted successfully (name set to 0)');
      setSelectedMap(null);
      fetchMaps();
    } catch (error) {
      console.error('Error deleting map:', error);
      alert(`Error deleting map: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <UserInfo />
        <LogoutButton />
      </header>
      <div style={{ display: 'flex' }}>
        <Navbar />
      </div>
      <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Map Edit</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3>Your Maps</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {maps.map((map) => (
            <li key={map._id} onClick={() => handleSelectMap(map)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}>
              {map.name}
            </li>
          ))}
        </ul>
        {selectedMap && (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Map Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength="2" // 최소 2글자 제한
              style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <textarea
              placeholder="Map Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <label style={{ margin: '10px 0', color: '#333' }}>
              <input
                type="checkbox"
                checked={isMonitored}
                onChange={(e) => setIsMonitored(e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              Set as monitored map
            </label>
            <button type="submit" style={{ padding: '10px 20px', margin: '20px 0', borderRadius: '5px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Update Map
            </button>
            <button type="button" onClick={handleSendMap} style={{ padding: '10px 20px', margin: '10px 0', borderRadius: '5px', backgroundColor: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Send Map to Robots
            </button>
            <button type="button" onClick={handleDeleteMap} style={{ padding: '10px 20px', margin: '10px 0', borderRadius: '5px', backgroundColor: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Delete Map
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default MapEditPage;
