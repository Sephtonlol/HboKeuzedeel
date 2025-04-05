import { ObjectId } from 'mongodb';

export interface Quiz {
  _id?: ObjectId;
  name: string;
  createdAt?: Date;
  createdBy?: string;
  questions: Question[];
}

export interface Question {
  name: string;
  type: 'yes_no' | 'multiple_choice' | 'open';
  answers: Answer;
}

export type Answer = YesNoAnswer | MultipleChoiceAnswer | OpenAnswer;

export interface YesNoAnswer {
  correctAnswer: boolean;
}

export interface MultipleChoiceAnswer {
  options: string[];
  correctAnswer: string;
}

export interface OpenAnswer {
  correctAnswer: string;
}
