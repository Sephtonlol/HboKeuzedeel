import { Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../db";
import { Room, Participant, Mode } from "../../interfaces/room.interface";
import { Quiz } from "../../interfaces/quiz.interface";
import Rand from "rand-seed";
import { cleanString, compare } from "../utils/comparisons.utils";
import { checkObjectId, checkRoomId, checkString } from "../utils/types.utils";
import { sanitizeQuiz, sanitizeRoom } from "../utils/sanitize.utils";
import { stat } from "fs";

const quizCollection = "quizzes";
const roomCollection = "rooms";

const random = new Rand(process.env.SEED);
const characters = process.env.ID_CHARACTERS as string;

export const create = async (
  socket: Socket,
  data: {
    token: string;
    name: string;
    roomName: string;
    quizId: string;
    public: boolean;
    mode: Mode;
  }
) => {
  const { name, roomName, quizId, public: _public, mode, token } = data;
  try {
    const db = await connectToDatabase();
    const isAuthorized = await db
      .collection("users")
      .findOne({ "user.token": token });

    if (!isAuthorized) {
      console.error(`Authorization failed for token: ${token}`);
    }
    if (!isAuthorized)
      return socket.emit("user:error", {
        error: "Unauthorized.",
      });

    if (!checkString(name))
      return socket.emit("user:error", {
        error: "Name is required and must be a non-empty string.",
      });

    if (!checkString(roomName))
      return socket.emit("user:error", {
        error: "RoomName is required and must be a non-empty string.",
      });

    if (!checkObjectId(quizId))
      return socket.emit("user:error", {
        error: "QuizId is required and must be an objectId.",
      });

    if (!mode) return socket.emit("user:error", { error: "Mode is required." });

    if (mode.type !== "team" && mode.type !== "ffa" && mode.type !== "coop") {
      return socket.emit("user:error", {
        error: "Mode type must be either 'team', 'ffa', or 'coop'.",
      });
    }

    if (
      mode.type === "team" &&
      (typeof mode.teams !== "number" || mode.teams < 2 || mode.teams > 10)
    ) {
      console.log(mode.teams);
      return socket.emit("user:error", {
        error: "Mode teams must be a number between 2 & 10",
      });
    }

    if (mode.type !== "team" && mode.teams)
      return socket.emit("user:error", {
        error: "Mode teams is only valid for team mode.",
      });

    const quiz = await db
      .collection<Quiz>(quizCollection)
      .findOne({ _id: new ObjectId(quizId) });

    if (!quiz)
      return socket.emit("user:error", { error: "Could not find quiz." });

    const typedQuiz: Quiz = {
      _id: quiz._id,
      name: quiz.name,
      questions: quiz.questions,
    };

    const rooms = await db.collection("rooms").find().toArray();
    const roomNumbers: string[] = rooms.map((room) => room.roomId);

    let roomId;

    do {
      roomId = Array.from(
        { length: Number(process.env.ROOM_ID_LENGTH) },
        () => characters[Math.floor(random.next() * characters.length)]
      ).join("");
    } while (roomNumbers.includes(roomId));

    const userToken = new ObjectId();

    const participant: Participant = {
      name,
      token: userToken,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      answers: [],
      team: 0,
    };

    const newRoom: Room = {
      name: roomName,
      roomId: roomId,
      participants: [participant],
      host: userToken,
      public: _public,
      quiz: typedQuiz,
      quizProgression: 0,
      locked: false,
      mode: mode,
    };

    await db.collection(roomCollection).insertOne(newRoom);

    await socket.join(roomId);

    return socket.emit("room:create", {
      message: `Successfully created ${_public ? "public" : "private"} room.`,
      roomId: roomId,
      token: userToken,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to create room." });
  }
};

export const join = async (
  socket: Socket,
  data: { name: string; roomId: string; team?: number }
) => {
  const { name, roomId, team } = data;
  try {
    if (!checkString(name))
      return socket.emit("user:error", {
        error: "Name is required and must be a non-empty string.",
      });

    if (!checkRoomId(roomId))
      return socket.emit("user:error", {
        error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
      });

    const cleanRoomId = cleanString(roomId);

    const db = await connectToDatabase();

    const room = await db
      .collection<Room>(roomCollection)
      .findOne({ roomId: cleanRoomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    if (room.locked)
      return socket.emit("user:error", { error: "Room has been locked." });

    if (room.quizProgression > 0)
      return socket.emit("user:error", {
        error: "Room has already started the quiz.",
      });

    if (
      room.mode?.type === "team" &&
      ((!team && team !== 0) || typeof team !== "number")
    )
      return socket.emit("user:error", {
        error: "Team is required and must be of type number.",
      });

    if (!room.participants)
      return socket.emit("user:error", {
        error: "Room participants not found.",
      });

    for (const participant of room.participants) {
      if (participant.name === name) {
        return socket.emit("user:error", {
          error: "Name provided already exists in room.",
        });
      }
    }

    const participantToken = new ObjectId();

    const newParticipant = {
      name,
      token: participantToken,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      answers: [],
      ...(room.mode?.type === "team" && { team }),
    };

    room.participants.push(newParticipant);

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: room.participants } });

    socket.join(roomId);

    const sanitizedRoom = sanitizeRoom(room);

    sanitizedRoom.quiz = sanitizeQuiz(sanitizedRoom.quiz);

    sanitizedRoom.quiz = undefined;

    socket.emit("room:join", {
      message: "Successfully joined the room.",
      roomId: roomId,
      token: participantToken,
    });

    socket.to(roomId).emit("room:update", {
      room: sanitizedRoom,
    });
    return socket.emit("room:update", {
      room: sanitizedRoom,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to join room." });
  }
};

export const kick = async (
  socket: Socket,
  data: { token: string; kick: string; roomId: string }
) => {
  const { token, kick, roomId } = data;
  try {
    if (!checkObjectId(token))
      return socket.emit("user:error", {
        error: "Token is required and must be an objectId.",
      });

    if (!checkRoomId(roomId))
      return socket.emit("user:error", {
        error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
      });

    if (!checkString(kick))
      return socket.emit("user:error", {
        error: "Kick is required and must be a non-empty string.",
      });

    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    if (token !== room.host.toString())
      return socket.emit("user:error", {
        error: "Only the host can kick participants.",
      });

    let removedParticipant: Participant | undefined;
    let found = false;

    const updatedParticipants = room.participants?.filter(
      (participant: Participant) => {
        if (!found && compare(participant.name, kick)) {
          removedParticipant = participant;
          found = true;
          return false;
        }
        return true;
      }
    );

    if (!room.participants)
      return socket.emit("user:error", {
        error: "Room participants not found.",
      });

    if (updatedParticipants?.length === room.participants.length)
      return socket.emit("user:error", {
        error: "Participant not found or already removed.",
      });

    room.participants = updatedParticipants;

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: updatedParticipants } });

    socket.emit("room:kick", {
      participant: removedParticipant?.token,
    });
    socket.to(roomId).emit("room:kick", {
      participant: removedParticipant?.token,
    });

    const sanitizedRoom = sanitizeRoom(room);

    sanitizedRoom.quiz = undefined;

    socket.emit("room:update", {
      room: sanitizedRoom,
    });
    return socket.to(roomId).emit("room:update", {
      room: sanitizedRoom,
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", {
      error: `Failed to kick ${kick} from room.`,
    });
  }
};

export const leave = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;
  try {
    if (!checkObjectId(token))
      return socket.emit("user:error", {
        error: "Token is required and must be an objectId.",
      });

    if (!checkRoomId(roomId))
      return socket.emit("user:error", {
        error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
      });

    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    if (!room.participants)
      return socket.emit("user:error", {
        error: "Room participants not found.",
      });

    const updatedParticipants =
      room.participants?.filter(
        (participant: Participant) => participant.token?.toString() !== token
      ) || [];

    if (updatedParticipants.length === room.participants.length)
      return socket.emit("user:error", {
        error: "Participant not found or already removed.",
      });

    if (token === room.host.toString()) {
      // If the host leaves, delete the room
      await db.collection(roomCollection).deleteOne({ roomId });
      socket.to(roomId).emit("room:kick", { participant: "all" });
      return socket.emit("room:kick", { participant: "all" });
    }
    // Update the room with the participant removed
    const sanitizedRoom = sanitizeRoom(room);

    sanitizedRoom.quiz = undefined;
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: updatedParticipants } });
    socket.to(roomId).emit("room:update", {
      room: {
        ...sanitizedRoom,
        participants: updatedParticipants,
      },
    });
    socket.leave(roomId);
    return socket.emit("user:success", {
      message: "Successfully left the room.",
    });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to leave room." });
  }
};

export const reconnect = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;
  try {
    if (!checkObjectId(token))
      return socket.emit("user:error", {
        error: "Token is required and must be an objectId.",
      });

    if (!checkRoomId(roomId))
      return socket.emit("user:error", {
        error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
      });

    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    if (!room.participants)
      return socket.emit("user:error", {
        error: "Room participants not found.",
      });

    let host = false;
    if (room.host.toString() === token) host = true;

    const isValidToken = room.participants.some(
      (participant) => participant.token?.toString() === token
    );

    if (!isValidToken)
      return socket.emit("user:error", { error: "Invalid token." });

    const sanitizedRoom = sanitizeRoom(room);

    const quiz = sanitizeQuiz(room.quiz as Quiz);

    sanitizedRoom.quiz = undefined;

    sanitizedRoom.participants.forEach((participant: any) => {
      participant.answers = undefined;
    });
    if (room.state !== "leaderboard") {
      sanitizedRoom.participants.forEach((participant: any) => {
        participant.correctAnswers = undefined;
        participant.score = undefined;
      });
    }

    let answerStats = undefined;
    let correctAnswer = undefined;

    const currentQuestion = room.quiz?.questions[room.quizProgression - 1];
    const questionType = currentQuestion?.type;

    if (room.state === "statistics") {
      const currentQuestion =
        room.quiz?.questions[room.quizProgression - 1].answers;

      const answerCountMap: Record<string, number> = {};

      if (questionType === "multiple_choice") {
        currentQuestion?.options.forEach((option) => {
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

      answerStats = Object.entries(answerCountMap).map(([answer, count]) => ({
        answer,
        count,
      }));
    }

    if (room.state == "answer" || room.state == "statistics")
      correctAnswer =
        room.quiz?.questions[room.quizProgression - 1].answers.correctAnswer;

    socket.join(roomId);
    return socket.emit("room:update", {
      host,
      room: sanitizedRoom,
      question: quiz?.questions[room.quizProgression - 1],
      quizLength: room.quiz?.questions.length,
      stats: answerStats,
      questionType,
      correctAnswer,
    });
  } catch (error) {
    return socket.emit("user:error", {
      error: `Failed to reconnect to room ${roomId}.`,
    });
  }
};

export const lock = async (
  socket: Socket,
  data: { token: string; roomId: string }
) => {
  const { token, roomId } = data;
  try {
    if (!checkObjectId(token))
      return socket.emit("user:error", {
        error: "Token is required and must be an objectId.",
      });

    if (!checkRoomId(roomId))
      return socket.emit("user:error", {
        error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
      });

    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    if (token !== room.host.toString())
      return socket.emit("user:error", {
        error: "Only the host can lock/unlock the room.",
      });

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { locked: !room.locked } });
    socket.emit("room:lock", { lock: !room.locked });
    return socket.to(roomId).emit("room:lock", { lock: !room.locked });
  } catch (error) {
    console.error(error);
    return socket.emit("user:error", { error: "Failed to lock/unlock room." });
  }
};
