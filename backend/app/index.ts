import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import {
  createRoom,
  getRoom,
  joinRoom,
  kickRoom,
} from "./controllers/room.controller";
import { createQuiz, getQuiz } from "./controllers/quiz.controller";
import {
  progressGame,
  answerQuestion,
  getQuestion,
} from "./controllers/game.controller";

const app = express();
const PORT = 3000;

console.log(process.env.appBaseUrl);

app.use(
  cors({
    origin: process.env.appBaseUrl, // Frontend
  })
);

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

app.patch("/room", async (req: Request, res: Response) => {
  kickRoom(req, res);
});

app.post("/quiz", async (req: Request, res: Response) => {
  createQuiz(req, res);
});

app.get("/quiz", async (req: Request, res: Response) => {
  getQuiz(req, res);
});

app.put("/progress", async (req: Request, res: Response) => {
  progressGame(req, res);
});

app.put("/question", async (req: Request, res: Response) => {
  answerQuestion(req, res);
});

app.get("/question", async (req: Request, res: Response) => {
  getQuestion(req, res);
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
