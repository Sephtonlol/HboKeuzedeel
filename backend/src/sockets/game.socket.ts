import { Socket } from "socket.io";
import { connectToDatabase } from "../db";
import { Room, Participant } from "../../interfaces/room.interface";
import { compare } from "../utils/comparisons.utils";
import { checkObjectId, checkRoomId } from "../utils/types.utils";
import { sanitizeQuiz, sanitizeRoom } from "../utils/sanitize.utils";

const roomCollection = "rooms";

export const showAnswer = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;

  try {
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

    if (!room.quiz || !room.quiz.questions) {
      return socket.emit("user:error", {
        error: "No quiz found in this room.",
      });
    }

    if (
      room.quizProgression <= 0 ||
      room.quizProgression > room.quiz.questions.length
    )
      return socket.emit("user:error", { error: "Invalid question index." });

    const allAnswered =
      room.participants?.every(
        (p: Participant) => p.totalAnswers >= room.quizProgression
      ) ?? false;

    if (!allAnswered)
      return socket.emit("user:error", {
        error: "Not all participants have answered the question.",
      });

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { state: "answer" } });

    socket.to(roomId).emit("quiz:answer", {
      correctAnswer:
        room.quiz?.questions[room.quizProgression - 1].answers.correctAnswer,
    });

    return socket.emit("quiz:answer", {
      correctAnswer:
        room.quiz?.questions[room.quizProgression - 1].answers.correctAnswer,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to show the Answer." });
  }
};

export const showStatistics = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;

  try {
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
        error: "Only the host can progress the game.",
      });

    const allAnswered =
      room.participants?.every(
        (p: Participant) => p.totalAnswers >= room.quizProgression
      ) ?? false;

    if (!allAnswered)
      return socket.emit("user:error", {
        error: "Not all participants have answered the question.",
      });

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { state: "statistics" } });

    const currentQuestion = room.quiz?.questions[room.quizProgression - 1];
    const questionType = currentQuestion?.type;

    const answerCountMap: Record<string, number> = {};

    if (questionType === "multiple_choice") {
      currentQuestion?.answers.options.forEach((option) => {
        answerCountMap[option] = 0;
      });
    } else if (questionType === "yes_no") {
      answerCountMap["true"] = 0;
      answerCountMap["false"] = 0;
    }

    room.participants?.forEach((participant) => {
      const lastAnswer = participant.answers.at(-1);
      if (!lastAnswer) return;

      if (questionType === "multiple_choice" || questionType === "yes_no") {
        if (answerCountMap.hasOwnProperty(lastAnswer)) {
          answerCountMap[lastAnswer]++;
        }
      } else {
        answerCountMap[lastAnswer] = (answerCountMap[lastAnswer] || 0) + 1;
      }
    });

    let answerStats = Object.entries(answerCountMap).map(([answer, count]) => ({
      answer,
      count,
    }));

    socket.to(roomId).emit("quiz:statistics", {
      stats: answerStats,
      questionType: room.quiz?.questions[room.quizProgression - 1].type,
      correctAnswer:
        room.quiz?.questions[room.quizProgression - 1].answers.correctAnswer,
    });
    return socket.emit("quiz:statistics", {
      stats: answerStats,
      questionType: room.quiz?.questions[room.quizProgression - 1].type,
      correctAnswer:
        room.quiz?.questions[room.quizProgression - 1].answers.correctAnswer,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to show stats." });
  }
};

export const showLeaderboard = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;
  try {
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
        error: "Only the host can progress the game.",
      });

    const allAnswered =
      room.participants?.every(
        (p: Participant) => p.totalAnswers >= room.quizProgression
      ) ?? false;

    if (!allAnswered)
      return socket.emit("user:error", {
        error: "Not all participants have answered the question.",
      });

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { state: "leaderboard" } });

    const sanitizedRoom = sanitizeRoom(room);

    socket.to(roomId).emit("quiz:leaderboard", {
      participants: sanitizedRoom.participants,
    });
    return socket.emit("quiz:leaderboard", {
      participants: sanitizedRoom.participants,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to show leaderboard." });
  }
};

export const progressGame = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;

  try {
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
        error: "Only the host can progress the game.",
      });

    if (!room.quiz || !room.quiz.questions)
      return socket.emit("user:error", {
        error: "No quiz found in this room.",
      });

    const allAnswered =
      room.participants?.every(
        (p: Participant) => p.totalAnswers >= room.quizProgression
      ) ?? false;

    if (!allAnswered)
      return socket.emit("user:error", {
        error: "Not all participants have answered the question.",
      });

    const totalQuestions = room.quiz.questions.length;

    if (room.quizProgression >= totalQuestions) {
      const sanitizedRoom = sanitizeRoom(room);
      socket
        .to(roomId)
        .emit("quiz:ended", { scores: sanitizedRoom.participants });
      return socket.emit("quiz:ended", { scores: sanitizedRoom.participants });
    }

    const sanitizedQuiz = sanitizeQuiz(room.quiz);

    await db
      .collection(roomCollection)
      .updateOne(
        { roomId },
        { $inc: { quizProgression: 1 }, $set: { state: "question" } }
      );

    const sanitizedRoom = sanitizeRoom(room);

    socket.emit("quiz:progressed", {
      quizProgression: room.quizProgression + 1,
      quizLength: room.quiz.questions.length,
      participants: sanitizedRoom.participants,
      lastQuestion: room.quiz?.questions[room.quizProgression - 1],
      question: sanitizedQuiz.questions[room.quizProgression],
    });

    return socket.to(roomId).emit("quiz:progressed", {
      quizProgression: room.quizProgression + 1,
      quizLength: room.quiz.questions.length,
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

  try {
    if (!checkRoomId(roomId))
      return socket.emit("user:error", {
        error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
      });

    if (!checkObjectId(token))
      return socket.emit("user:error", { error: "Token is invalid." });

    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    const participant: Participant | undefined = room.participants?.find(
      (p: Participant) => p.token?.toString() === token
    );
    if (!room.participants || !participant)
      return socket.emit("user:error", { error: "Participant not found." });

    if (participant.totalAnswers > room.quizProgression - 1) {
      if (room.quizProgression == -1)
        return socket.emit("user:error", { error: "Quiz hasn't started yet." });

      return socket.emit("user:error", {
        error: "You have already answered the question.",
      });
    }

    participant.totalAnswers += 1;
    participant.answers.push(answer);

    const questionIndex = participant.totalAnswers;
    const currentQuestion = room.quiz?.questions[questionIndex - 1];

    if (!currentQuestion)
      return socket.emit("user:error", { error: "Invalid question index." });

    const isCorrect = compare(currentQuestion.answers.correctAnswer, answer);

    if (isCorrect) {
      participant.correctAnswers += 1;
      participant.score += 100;
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
