import React, { useRef, useState, useEffect } from 'react';

import './App.css';
import axios from 'axios';

function App() {
    const videoRef = useRef(null);
    const [result, setResult] = useState({ men: 0, women: 0 });
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            })
            .catch(err => {
                console.error("Error accessing webcam: ", err);
            });

        const sendFrame = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set canvas size to match video
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            function captureAndSend() {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    const formData = new FormData();
                    formData.append('frame', blob);

                    // Send frame to server
                    axios.post('/detect', formData)
                        .then(response => {
                            setResult({
                                men: response.data.men,
                                women: response.data.women
                            });
                        })
                        .catch(err => {
                            console.error("Error sending frame to server: ", err);
                        });
                }, 'image/jpeg');

                requestAnimationFrame(captureAndSend);
            }

            captureAndSend();
        };

        sendFrame();

        const fetchCurrentTime = async () => {
            try {
                const response = await axios.get('/current-time');
                setCurrentTime(response.data.current_time);
            } catch (err) {
                console.error("Error fetching current time: ", err);
            }
        };

        fetchCurrentTime();
        const intervalId = setInterval(fetchCurrentTime, 60000); 
        return () => clearInterval(intervalId); 
    }, []);

    return (
        <div className="App">
            <h1>Gender Detection and Current Time</h1>
            <video ref={videoRef} autoPlay width="640" height="480" />
            <div className="result">
                <h2>Gender Detection</h2>
                <p>Men: {result.men.toFixed(2)}%</p>
                <p>Women: {result.women.toFixed(2)}%</p>
            </div>
            <div className="time">
                <h2>Current Time</h2>
                <p>{currentTime}</p>
            </div>
        </div>
    );
}

export default App;
