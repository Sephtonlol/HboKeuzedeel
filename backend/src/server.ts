import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import socketRoutes from "./routes/server.routes";
import { checkEnvVars } from "./utils/env.utils";

const PORT = process.env.SERVER_PORT;
const app = express();
const server = http.createServer(app);

checkEnvVars(false);

const io = new Server(server, {
  cors: {
    origin: process.env.APP_BASE_URL, // Frontend websockets
  },
  path: "/",
  transports: ["websocket"],
});

socketRoutes(io);

server.listen(PORT, () => { 
  console.log(`Server listening on PORT ${PORT}`);
});