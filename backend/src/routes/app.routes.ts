import { Router, Request, Response } from "express";
import { getRoom } from "../controllers/room.controller";
import {
  createQuiz,
  getQuiz,
  searchQuizzes,
} from "../controllers/quiz.controller";
import { login, register, user } from "../controllers/account.controller";

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

router.get("/quizSearch", (req: Request, res: Response) => {
  searchQuizzes(req, res);
});

router.post("/login", (req: Request, res: Response) => {
  login(req, res);
});

router.post("/register", (req: Request, res: Response) => {
  register(req, res);
});

router.get("/user", (req: Request, res: Response) => {
  user(req, res);
});

export default router;
