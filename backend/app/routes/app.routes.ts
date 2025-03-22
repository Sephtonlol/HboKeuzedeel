import { Router, Request, Response } from "express";
import {
  createRoom,
  getRoom,
  joinRoom,
  kickRoom,
} from "../controllers/room.controller";
import { createQuiz, getQuiz } from "../controllers/quiz.controller";
import {
  answerQuestion,
  getQuestion,
  progressGame,
} from "../controllers/game.controller";

const router = Router();

router.post("/room", (req: Request, res: Response) => {
  createRoom(req, res);
});

router.put("/room", (req: Request, res: Response) => {
  joinRoom(req, res);
});

router.get("/room", (req: Request, res: Response) => {
  getRoom(req, res);
});

router.patch("/room", (req: Request, res: Response) => {
  kickRoom(req, res);
});

router.post("/quiz", (req: Request, res: Response) => {
  createQuiz(req, res);
});

router.get("/quiz", (req: Request, res: Response) => {
  getQuiz(req, res);
});

router.put("/progress", (req: Request, res: Response) => {
  progressGame(req, res);
});

router.put("/question", (req: Request, res: Response) => {
  answerQuestion(req, res);
});

router.get("/question", (req: Request, res: Response) => {
  getQuestion(req, res);
});

export default router;
