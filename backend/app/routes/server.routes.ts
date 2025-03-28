import { Socket, Server } from "socket.io";
import { create, join, kick, leave, reconnect } from "../sockets/room.socket";
import { answerQuestion, progressGame } from "../sockets/game.socket";

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

    socket.on("room:leave", async (data) => {
      leave(socket, data);
    });

    socket.on("room:reconnect", async (data) => {
      reconnect(socket, data);
    });
    socket.on("game:answer", async (data) => {
      answerQuestion(socket, data);
    });

    socket.on("game:progress", async (data) => {
      progressGame(socket, data);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
