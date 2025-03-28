import { Router, Request, Response } from "express";
import { getRoom } from "../controllers/room.controller";
import { createQuiz, getQuiz } from "../controllers/quiz.controller";

const router = Router();

router.get("/room", (req: Request, res: Response) => {
  getRoom(req, res);
});

router.post("/quiz", (req: Request, res: Response) => {
  createQuiz(req, res);
});

router.get("/quiz", (req: Request, res: Response) => {
  getQuiz(req, res);
});

export default router;
