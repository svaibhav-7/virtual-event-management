const express = require('express');
const { v4: uuidv4 } = require('uuid'); // Generate unique room IDs
const app = express();
const PORT = 5000;

app.use(express.json());

// In-memory storage for rooms (for demonstration purposes)
let rooms = [];

// Create a room
app.post('/api/create-room', (req, res) => {
  const roomId = uuidv4(); // Generate a unique room ID
  rooms.push(roomId);
  res.json({ roomId });
});

// List all rooms (optional, for debugging)
app.get('/api/rooms', (req, res) => {
  res.json({ rooms });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
