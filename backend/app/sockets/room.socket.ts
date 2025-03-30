import { Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../db";
import { Room, Participant, Mode } from "../../interfaces/room.interface";
import { Quiz } from "../../interfaces/quiz.interface";
import Rand from "rand-seed";
import { compare } from "../utils/comparisons.utils";
import { checkObjectId, checkRoomId, checkString } from "../utils/types.utils";
import { sanitizeQuiz, sanitizeRoom } from "../utils/sanitize.utils";

const quizCollection = "quizzes";
const roomCollection = "rooms";

const random = new Rand(process.env.SEED);
const characters = process.env.ID_CHARACTERS as string;

export const create = async (
  socket: Socket,
  data: { name: string; quizId: string; public: boolean; mode: Mode }
) => {
  const { name, quizId, public: _public, mode } = data;

  if (!checkString(name))
    return socket.emit("user:error", {
      error: "Name is required and must be a non-empty string.",
    });

  if (!checkObjectId(quizId))
    return socket.emit("user:error", {
      error: "QuizId is required and must be an objectId.",
    });

  const db = await connectToDatabase();
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

  try {
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
    };

    const newRoom: Room = {
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

  if (!checkString(name))
    return socket.emit("user:error", {
      error: "Name is required and must be a non-empty string.",
    });

  if (!checkRoomId(roomId))
    return socket.emit("user:error", {
      error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
    });

  const db = await connectToDatabase();

  const room = await db.collection<Room>(roomCollection).findOne({ roomId });
  if (!room) return socket.emit("user:error", { error: "Room not found." });

  if (room.locked)
    return socket.emit("user:error", { error: "Room has been locked." });

  if (room.quizProgression > 0)
    return socket.emit("user:error", {
      error: "Room has already started the quiz.",
    });

  if (typeof team !== "number")
    return socket.emit("user:error", {
      error: "Team must be of type number.",
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

  try {
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: room.participants } });

    socket.join(roomId);

    const sanitizedRoom = sanitizeRoom(room);

    sanitizedRoom.quiz = sanitizeQuiz(sanitizedRoom.quiz);

    socket.emit("room:join", {
      message: "Successfully joined the room.",
      roomId: roomId,
      token: participantToken,
    });

    socket.to(roomId).emit("room:update", {
      participants: sanitizedRoom.participants,
    });
    return socket.emit("room:update", {
      participants: sanitizedRoom.participants,
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

  try {
    const sanitizedRoom = sanitizeRoom(room);
    const updatedParticipants = sanitizedRoom.participants.filter(
      (participant: Participant) => !compare(participant.name, kick)
    );

    if (updatedParticipants.length === room.participants.length)
      return socket.emit("user:error", {
        error: "Participant not found or already removed.",
      });

    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: updatedParticipants } });

    socket.emit("room:kick", {
      participant: kick,
    });
    return socket.to(roomId).emit("room:kick", {
      participant: kick,
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

  try {
    const updatedParticipants = room.participants.filter(
      (participant: Participant) => participant.token?.toString() !== token
    );

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
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: updatedParticipants } });
    socket.to(roomId).emit("room:update", {
      participants: sanitizeRoom({
        ...room,
        participants: updatedParticipants,
      }).participants,
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

  if (!checkObjectId(token))
    return socket.emit("user:error", {
      error: "Token is required and must be an objectId.",
    });

  if (!checkRoomId(roomId))
    return socket.emit("user:error", {
      error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
    });

  try {
    const db = await connectToDatabase();
    const room = await db.collection<Room>(roomCollection).findOne({ roomId });

    if (!room) return socket.emit("user:error", { error: "Room not found." });

    const isValidToken = room.participants.some(
      (participant) => participant.token?.toString() === token
    );

    if (!isValidToken)
      return socket.emit("user:error", { error: "Invalid token." });

    const sanitizedRoom = sanitizeRoom(room);

    sanitizedRoom.quiz = sanitizeQuiz(sanitizedRoom.quiz);

    socket.join(roomId);
    return socket.emit("room:update", {
      message: "Successfully reconnected to room.",
      participants: sanitizedRoom.participants,
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

  if (!checkObjectId(token))
    return socket.emit("user:error", {
      error: "Token is required and must be an objectId.",
    });

  if (!checkRoomId(roomId))
    return socket.emit("user:error", {
      error: `RoomId is required and must be a ${process.env.ROOM_ID_LENGTH}-character long string.`,
    });

  try {
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
