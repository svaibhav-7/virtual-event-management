const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Mute User
socket.on("mute-user", ({ userId, roomId }) => {
  socket.to(roomId).emit("mute-user", userId); // Mute the specific user
});

// Remove User
socket.on("remove-user", ({ userId, roomId }) => {
  socket.to(roomId).emit("remove-user", userId); // Remove the user from the room
});

socket.on("disconnect", () => {
  // Notify the room that the user left
  socket.to(socket.roomId).emit("user-left", socket.userName);
});



io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
    socket.broadcast.to(roomId).emit("user-joined", { signal: null });

    socket.on("return-signal", ({ signal }) => {
      socket.broadcast.to(roomId).emit("receive-signal", { signal });
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.id} left room ${roomId}`);
    });
  });

  // Handle private message
socket.on("send-private-message", (message) => {
  const { recipientId, text, sender } = message;
  // Assuming `recipientId` maps to a socket user id
  socket.to(recipientId).emit("private-message", { text, sender });
});


  // Handle screen sharing stream
    socket.on("start-screen-share", (screenStream, roomId) => {
      socket.to(roomId).emit("screen-share-stream", screenStream); // Broadcast to room
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
