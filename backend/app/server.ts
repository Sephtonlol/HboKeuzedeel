import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";

const PORT = process.env.SERVER_PORT;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.APP_BASE_URL, // Frontend websockets
  },
  path: "/",
  transports: ["websocket"],
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("createRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log("App listening on PORT", PORT);
});
