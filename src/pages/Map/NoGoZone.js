// src/components/MapManage/NoGoZone.js

import React, { useRef, useState } from 'react';
import axios from 'axios';
import './NoGoZone.css';

function NoGoZone({ mapId, onClose, onNoGoZoneCreated }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);

  // 금지 구역 그리기
  const drawRectangle = (ctx, rect, color = 'rgba(255, 0, 0, 0.3)') => {
    if (!rect) return;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill();
    ctx.stroke();
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    setCurrentRect({
      x: width >= 0 ? startPoint.x : currentX,
      y: height >= 0 ? startPoint.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    });

    // 캔버스 클리어 및 기존 사각형 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRectangle(ctx, currentRect);
    drawRectangle(ctx, {
      x: width >= 0 ? startPoint.x : currentX,
      y: height >= 0 ? startPoint.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !startPoint || !currentRect) return;
    setIsDrawing(false);

    // 금지구역 저장
    saveNoGoZone(currentRect);

    setStartPoint(null);
    setCurrentRect(null);
  };

  const saveNoGoZone = async (rect) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('토큰이 없습니다. 다시 로그인해주세요.');
      return;
    }

    // 좌상단과 우하단 좌표 계산
    const topLeft = { x: rect.x, y: rect.y };
    const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height };

    try {
      await axios.post('http://13.209.28.158:5557/map/no-go-zones', {
        topLeft,
        bottomRight,
        mapId,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      alert('금지구역이 성공적으로 생성되었습니다.');
      onNoGoZoneCreated();
    } catch (error) {
      console.error('금지구역 생성 중 오류 발생:', error);
      alert(`금지구역 생성 중 오류 발생: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="nogozone-popup">
      <div className="nogozone-popup-content">
        <h3>금지 구역 생성</h3>
        <p>지도를 드래그하여 금지 구역을 설정하세요.</p>
        <canvas
          ref={canvasRef}
          className="nogozone-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        <button onClick={onClose} className="nogozone-close-button">
          닫기
        </button>
      </div>
    </div>
  );
}

export default NoGoZone;
