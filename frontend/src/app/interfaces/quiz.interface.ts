import { ObjectId } from 'mongodb';

export interface Quiz {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
  createdBy?: string;
  questions: Question[];
}

export interface Question {
  name: string;
  type: 'yes_no' | 'multiple_choice' | 'open';
  answers: Answer;
}

export interface Answer {
  options: string[];
  correctAnswer: string | boolean;
}
