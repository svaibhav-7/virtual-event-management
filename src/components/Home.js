import React, { useState } from 'react';

const Home = ({ roomId, setRoomId, username, setUsername, setIsInRoom, socket }) => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleJoinRoom = () => {
    if (roomId && username) {
      socket.emit('join-room', { roomId, username });
      setIsInRoom(true);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    setRoomId(newRoomId);
    setIsCreatingRoom(false);
    setIsInRoom(true);
    socket.emit('create-room', { roomId: newRoomId, username });
  };

  return (
    <div>
      {!isCreatingRoom ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Enter Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
          />
          <div className="mainButtons">
            <button onClick={handleJoinRoom} className="button">
              Join Room
            </button>
            <button onClick={() => setIsCreatingRoom(true)} className="button">
              Create Room
            </button>
          </div>
        </div>
      ) : (
        <div className="create-Room">
          <h3>Creating Room...</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={handleCreateRoom} className="button">
              Create Room with ID: {roomId}
            </button>
            <button onClick={() => setIsCreatingRoom(false)} className="button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
