import { ObjectId } from "mongodb";
import { Quiz } from "./quiz.interface";

export interface Room {
  _id?: ObjectId;
  roomId: number;
  participants: Participant[];
  public: boolean;
  quiz?: Quiz;
}

export interface Participant {
  name: string;
  score: number;
  correctAnswers: number;
}
