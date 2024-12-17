import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const WebcamStream = () => {
    const videoRef = useRef(null);

    useEffect(() => {
        const socket = io('http://3.35.87.118:7001');

        socket.on('video', (data) => {
            if (videoRef.current) {
                videoRef.current.src = `data:image/jpeg;base64,${data}`;
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return <img ref={videoRef} alt="Webcam Stream" style={{ width: '100%' }} />;
};

export default WebcamStream;


