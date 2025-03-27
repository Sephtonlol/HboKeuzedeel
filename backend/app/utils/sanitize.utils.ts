import { Quiz } from "../../interfaces/quiz.interface";
import { Participant, Room } from "../../interfaces/room.interface";

export const sanitizeRooms = (fetchedRooms: Room[]): any[] => {
  return fetchedRooms.map((room) => {
    const sortedParticipants = room.participants.sort(
      (a: Participant, b: Participant) => b.score - a.score
    );

    return {
      ...room,
      host: undefined,
      participants: sortedParticipants.map(({ token, ...rest }) => rest),
    };
  });
};

export const sanitizeRoom = (room: Room): any => {
  const sortedParticipants = room.participants.sort(
    (a, b) => b.score - a.score
  );

  return {
    ...room,
    host: undefined,
    participants: sortedParticipants.map(({ token, ...rest }) => rest),
  };
};

export const sanitizeQuiz = (quiz: Quiz): any => {
  return {
    ...quiz,
    questions: quiz.questions.map((question: any) => ({
      ...question,
      answers: (() => {
        if ("correctAnswer" in question.answers) {
          const { correctAnswer, ...rest } = question.answers;
          return rest;
        }
        return question.answers;
      })(),
    })),
  };
};

export const sanitizeQuizzes = (quizzes: Quiz[]): any[] => {
  return quizzes.map((quiz) => ({
    ...quiz,
    questions: quiz.questions.map((question: any) => ({
      ...question,
      answers: (() => {
        if ("correctAnswer" in question.answers) {
          const { correctAnswer, ...rest } = question.answers;
          return rest;
        }
        return question.answers;
      })(),
    })),
  }));
};
