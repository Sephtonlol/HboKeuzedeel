import { Socket } from "socket.io";
import { connectToDatabase } from "../db";
import { Room, Participant } from "../../interfaces/room.interface";
import { compare } from "../utils/comparisons.utils";
import { checkObjectId, checkRoomId } from "../utils/types.utils";
import { sanitizeQuiz, sanitizeRoom } from "../utils/sanitize.utils";

const roomCollection = "rooms";

export const progressGame = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;

  if (!checkRoomId(roomId))
    return socket.emit("user:error", {
      error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
    });

  if (!checkObjectId(token))
    return socket.emit("user:error", { error: "Token is invalid." });

  const db = await connectToDatabase();
  const room = await db.collection<Room>(roomCollection).findOne({ roomId });

  if (!room) return socket.emit("user:error", { error: "Room not found." });

  if (room.host.toString() !== token)
    return socket.emit("user:error", {
      error: "Only the host can start the game.",
    });

  if (!room.quiz || !room.quiz.questions)
    return socket.emit("user:error", {
      error: "No quiz found in this room.",
    });

  const allAnswered =
    room.participants?.every(
      (p: Participant) => p.totalAnswers >= room.quizProgression - 1
    ) ?? false;
  console.log(room.participants);
  console.log(allAnswered);

  if (!allAnswered)
    return socket.emit("user:error", {
      error: "Not all participants have answered the question.",
    });

  const totalQuestions = room.quiz.questions.length;

  const sanitizedRoom = sanitizeRoom(room);
  if (room.quizProgression > totalQuestions) {
    socket
      .to(roomId)
      .emit("quiz:ended", { scores: sanitizedRoom.participants });
    return socket.emit("quiz:ended", { scores: sanitizedRoom.participants });
  }
  const sanitizedQuiz = sanitizeQuiz(room.quiz);

  try {
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $inc: { quizProgression: 1 } });

    socket.emit("quiz:progressed", {
      participants: sanitizedRoom.participants,
      lastQuestion: room.quiz?.questions[room.quizProgression - 1],
      question: sanitizedQuiz.questions[room.quizProgression],
    });

    return socket.to(roomId).emit("quiz:progressed", {
      participants: sanitizedRoom.participants,
      lastQuestion: room.quiz?.questions[room.quizProgression - 1],
      question: sanitizedQuiz.questions[room.quizProgression],
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to progress the game." });
  }
};

export const answerQuestion = async (
  socket: Socket,
  data: { token: string; roomId: string; answer: string }
) => {
  const { token, roomId, answer } = data;

  if (!checkRoomId(roomId))
    return socket.emit("user:error", {
      error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
    });

  if (!checkObjectId(token))
    return socket.emit("user:error", { error: "Token is invalid." });

  try {
    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    const participant: Participant | undefined = room.participants?.find(
      (p: Participant) => p.token?.toString() === token
    );
    if (!room.participants || !participant)
      return socket.emit("user:error", { error: "Participant not found." });

    if (participant.totalAnswers > room.quizProgression) {
      if (room.quizProgression == -1)
        return socket.emit("user:error", { error: "Quiz hasn't started yet." });

      return socket.emit("user:error", {
        error: "You have already answered the question.",
      });
    }

    participant.totalAnswers += 1;
    participant.answers.push(answer);

    const questionIndex = participant.totalAnswers;
    const currentQuestion = room.quiz?.questions[questionIndex];

    if (!currentQuestion)
      return socket.emit("user:error", { error: "Invalid question index." });

    const isCorrect = compare(currentQuestion.answers.correctAnswer, answer);

    if (isCorrect) {
      participant.correctAnswers += 1;
      participant.score += 5;
    }
    await db
      .collection<Room>("rooms")
      .updateOne({ roomId }, { $set: { participants: room.participants } });

    socket.to(roomId).emit("question:answered", { name: participant.name });
    return socket.emit("question:answered", {
      name: participant.name,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to answer question." });
  }
};
