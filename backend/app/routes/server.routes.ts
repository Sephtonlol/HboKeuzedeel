import { Socket, Server } from "socket.io";
import { create, join, kick, reconnect } from "../sockets/room.socket";

export default function socketRoutes(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("room:create", async (data) => {
      create(socket, data);
    });

    socket.on("room:join", async (data) => {
      join(socket, data);
    });

    socket.on("room:kick", async (data) => {
      kick(socket, data);
    });

    socket.on("room:reconnect", async (data) => {
      reconnect(socket, data);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
