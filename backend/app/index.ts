import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import { createRoom, getRoom, joinRoom } from "./controllers/room.controller";
import { createQuiz, getQuiz } from "./controllers/quiz.controller";
import { startGame } from "./controllers/game.controller";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.post("/room", async (req: Request, res: Response) => {
  createRoom(req, res);
});

app.put("/room", async (req: Request, res: Response) => {
  joinRoom(req, res);
});

app.get("/room", async (req: Request, res: Response) => {
  getRoom(req, res);
});

app.post("/quiz", async (req: Request, res: Response) => {
  createQuiz(req, res);
});

app.get("/quiz", async (req: Request, res: Response) => {
  getQuiz(req, res);
});

app.put("/startGame", async (req: Request, res: Response) => {
  startGame(req, res);
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
