import React, { useState } from 'react';
import './App.css';
import io from 'socket.io-client';
import Home from './components/Home';
import Room from './components/Room';

const fontAwesomeCDN = document.createElement("link");
fontAwesomeCDN.rel = "stylesheet";
fontAwesomeCDN.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
document.head.appendChild(fontAwesomeCDN);

const socket = io('http://localhost:5000');

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);

  return (
    <div>
      <h1 className="heading">Virtual Event Room</h1>
      {!isInRoom ? (
        <Home
          roomId={roomId}
          setRoomId={setRoomId}
          username={username}
          setUsername={setUsername}
          setIsInRoom={setIsInRoom}
          socket={socket}
        />
      ) : (
        <Room
          roomId={roomId}
          username={username}
          setIsInRoom={setIsInRoom}
          socket={socket}
        />
      )}
    </div>
  );
}

export default App;
