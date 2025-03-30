import { ObjectId } from "mongodb";
import { Quiz } from "./quiz.interface";

export interface Room {
  _id?: ObjectId;
  roomId: string;
  participants: Participant[];
  host: ObjectId;
  public: boolean;
  quizProgression: number;
  locked: boolean;
  quiz?: Quiz;
  mode?: Mode;
}

export interface Mode {
  type: "ffa" | "team" | "coop";
  teams?: number;
}

export interface Participant {
  name: string;
  token?: ObjectId;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  team?: number;
  answers: string[];
}
