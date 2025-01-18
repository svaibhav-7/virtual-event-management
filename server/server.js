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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
