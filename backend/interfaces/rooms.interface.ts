import { ObjectId } from "mongodb";
import { Quiz } from "./quiz.interface";

export interface Room {
  _id?: ObjectId;
  roomId: string;
  participants: Participant[];
  host: ObjectId;
  public: boolean;
  quiz?: Quiz;
  quizProgression: number;
}

export interface Participant {
  name: string;
  token?: ObjectId;
  score: number;
  correctAnswers: number;
  answers: number;
  team?: number;
}
