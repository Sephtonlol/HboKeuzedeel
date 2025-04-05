import { ObjectId } from 'mongodb';
import { Quiz } from './quiz.interface';

export interface Room {
  name: string;
  _id?: ObjectId;
  roomId: string;
  participants?: Participant[];
  host: ObjectId;
  public: boolean;
  quizProgression: number;
  locked: boolean;
  quiz?: Quiz;
  mode?: Mode;
}

export interface SimpleRoom {
  name: string;
  _id?: ObjectId;
  roomId: string;
  quizProgression: number;
  locked: boolean;
  mode?: Mode;
  hostName: string;
  participantCount: number;
}

export interface Mode {
  type: 'ffa' | 'team' | 'coop';
  teams?: number;
}

export interface Participant {
  name: string;
  token?: ObjectId;
  score: number;
  correctAnswers: number;
  team?: number;
}
