import { Request, response, Response } from "express";
import { Participant, Room } from "../../interfaces/rooms.interface";
import { connectToDatabase } from "../db";

const roomCollection = "rooms";

export const progressGame = async (req: Request, res: Response) => {
  const { token, roomId } = req.body;

  if (!roomId) return res.status(422).json({ error: "RoomId is required." });

  if (typeof roomId !== "number")
    return res.status(422).json({ error: "RoomId is must be of type number." });

  const db = await connectToDatabase();
  const room = await db
    .collection<Room>(roomCollection)
    .findOne({ roomId: roomId });

  if (!room) return res.status(404).json({ error: "Room not found." });

  if (room.host.toString() !== token)
    return res.status(401).json({ error: "Only the host can start the game." });

  if (!room.quiz || !room.quiz.questions) {
    return res.status(404).json({ error: "No quiz found for this room." });
  }

  const allAnswered = room.participants.every(
    (p: Participant) => p.answers >= room.quizProgression
  );

  if (!allAnswered) {
    return res
      .status(400)
      .json({ error: "Not all participants have answered the question." });
  }

  const totalQuestions = room.quiz.questions.length;

  const sortedParticipants = room.participants
    .sort((a: Participant, b: Participant) => b.score - a.score)
    .map(({ token, ...rest }) => rest);

  if (room.quizProgression >= totalQuestions - 1) {
    return res
      .status(200)
      .json({ message: "Quiz has ended.", scores: sortedParticipants });
  }

  try {
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $inc: { quizProgression: 1 } });

    res.status(200).json({
      message: "Next question started",
      quizProgression: room.quizProgression + 1,
      totalQuestions: totalQuestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start the game." });
  }
};

export const answerQuestion = async (req: Request, res: Response) => {
  const { token, roomId, answer } = req.body;

  if (!roomId) return res.status(422).json({ error: "RoomId is required." });

  if (typeof roomId !== "number")
    return res.status(422).json({ error: "RoomId is must be of type number." });

  const db = await connectToDatabase();
  const room = await db
    .collection<Room>(roomCollection)
    .findOne({ roomId: roomId });

  if (!room) return res.status(404).json({ error: "Room not found." });

  const participant = room.participants.find(
    (p: Participant) => p.token?.toString() === token
  );
  if (!participant) return res.status(422).json({ error: "Token is invalid." });

  if (participant.answers >= room.quizProgression) {
    if (room.quizProgression == -1)
      return res.status(422).json({ error: "Quiz hasn't started yet." });
    return res.status(422).json({
      error: "You have already answered the question.",
    });
  }
  try {
    participant.answers += 1;

    const questionIndex = participant.answers;
    const currentQuestion = room.quiz?.questions[questionIndex];

    if (!currentQuestion) {
      return res.status(400).json({ error: "Invalid question index." });
    }

    const isCorrect =
      currentQuestion.answers.correctAnswer.toString() === answer.toString();

    if (isCorrect) {
      participant.correctAnswers += 1;
      participant.score += 5; // MAKE IT SO WHEN CREATING A QUIZ YOU CAN CHOOSE HOW MUCH A QUESTION IS WORTH TODO
    }

    await db
      .collection<Room>("rooms")
      .updateOne({ roomId }, { $set: { participants: room.participants } });

    res.status(200).json({
      message: isCorrect,
    });
  } catch (error) {
    console.error(error);
    return res.status(422).json({
      error: "Failed to answer question.",
    });
  }
};

export const getQuestion = async (req: Request, res: Response) => {
  const { token, roomId } = req.body;

  if (!roomId) return res.status(422).json({ error: "RoomId is required." });

  if (typeof roomId !== "number")
    return res.status(422).json({ error: "RoomId is must be of type number." });

  const db = await connectToDatabase();
  const room = await db
    .collection<Room>(roomCollection)
    .findOne({ roomId: roomId });

  if (!room) return res.status(404).json({ error: "Room not found." });

  const participant = room.participants.find(
    (p: Participant) => p.token?.toString() === token
  );
  if (!participant) return res.status(422).json({ error: "Token is invalid." });

  if (!room.quiz?.questions[room.quizProgression]) {
    if (room.quizProgression == -1)
      return res.status(422).json({ error: "Quiz hasn't started yet." });
    const sortedParticipants = room.participants
      .sort((a: Participant, b: Participant) => b.score - a.score)
      .map(({ token, ...rest }) => rest);
    return res
      .status(200)
      .json({ message: "Quiz has ended.", scores: sortedParticipants });
  }
  const { correctAnswer, ...filteredAnswers } =
    room.quiz.questions[room.quizProgression].answers ?? {};

  const question = {
    ...room.quiz.questions[room.quizProgression],
    answers: filteredAnswers,
  };

  return res.status(200).json({ question });
};
