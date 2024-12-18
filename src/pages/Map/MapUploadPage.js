import React, { useState } from 'react';
import Navbar from '../../components/Common/Navbar';
import LogoutButton from '../../components/Common/LogoutButton';
import UserInfo from '../../components/Common/UserInfo';
import axios from 'axios';

function MapUploadPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapFile, setMapFile] = useState(null);
  const [yamlFile, setYamlFile] = useState(null);

  const handleMapFileChange = (e) => {
    setMapFile(e.target.files[0]);
  };

  const handleYamlFileChange = (e) => {
    setYamlFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (name.length < 2) {
      alert('Map name must be at least 2 characters long');
      return;
    }

    const formData = new FormData();
    formData.append('file', mapFile);
    formData.append('yaml', yamlFile);
    formData.append('name', name);
    formData.append('description', description);

    const token = localStorage.getItem('token');

    if (!token) {
      alert('No token found, please log in again.');
      return;
    }

    try {
      await axios.post('http://3.39.166.207:5557/map/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Map uploaded successfully');
      setName('');
      setDescription('');
      setMapFile(null);
      setYamlFile(null);
    } catch (error) {
      console.error('Error uploading map:', error);
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
      <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Map Create</h2>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Map Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength="2" // 최소 글자 수 제한 추가
          style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <textarea
          placeholder="Map Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <label htmlFor="map-upload" style={{ margin: '10px 0', color: '#333' }}>Map 파일을 올려주세요</label>
        <input
          id="map-upload"
          type="file"
          accept=".pgm,.png,.jpg"
          onChange={handleMapFileChange}
          required
          style={{ margin: '10px 0' }}
        />
        <label htmlFor="yaml-upload" style={{ margin: '10px 0', color: '#333' }}>YAML 파일을 올려주세요</label>
        <input
          id="yaml-upload"
          type="file"
          accept=".yaml"
          onChange={handleYamlFileChange}
          required
          style={{ margin: '10px 0' }}
        />
        <button type="submit" style={{ padding: '10px 20px', margin: '20px 0', borderRadius: '5px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Upload Map
        </button>
      </form>
    </div>
  );
}

export default MapUploadPage;
