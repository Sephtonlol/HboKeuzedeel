import { ObjectId } from "mongodb";

export interface Quiz {
  _id?: ObjectId;
  name: string;
  questions: Question[];
}

export interface Question {
  name: string;
  type: "yes_no" | "multiple_choice" | "open";
  answers: Answer;
}

export type Answer = YesNoAnswer | MultipleChoiceAnswer | OpenAnswer;

export interface YesNoAnswer {
  type: "yes_no";
  correctAnswer: boolean;
}

export interface MultipleChoiceAnswer {
  type: "multiple_choice";
  options: string[];
  correctAnswer: string;
}

export interface OpenAnswer {
  type: "open";
  correctAnswer: string;
}
