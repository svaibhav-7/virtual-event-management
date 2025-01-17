import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const id = Math.random().toString(36).substr(2, 9);
    navigate(`/room/${id}`);
  };

  const handleJoinRoom = () => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div>
      <h1>Virtual Event Management</h1>
      <button onClick={handleCreateRoom}>Create Room</button>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoinRoom}>Join Room</button>
    </div>
  );
}

export default Home;
