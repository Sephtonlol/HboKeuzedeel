import { Socket } from "socket.io";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../db";
import { Room, Participant } from "../../interfaces/rooms.interface";
import { Quiz } from "../../interfaces/quiz.interface";
import Rand from "rand-seed";
import { compareString } from "../utils/comparisons.utils";
import { checkObjectId, checkRoomId, checkString } from "../utils/types.utils";
import { sanitizeRoom } from "../utils/sanitize.utils";

const quizCollection = "quizzes";
const roomCollection = "rooms";

const random = new Rand(process.env.SEED);
const characters = process.env.ID_CHARACTERS as string;

export const create = async (
  socket: Socket,
  data: { name: string; quizId: string; public: boolean }
) => {
  const { name, quizId, public: _public } = data;

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
      answers: 0,
    };

    const newRoom: Room = {
      roomId: roomId,
      participants: [participant],
      host: userToken,
      public: _public,
      quiz: typedQuiz,
      quizProgression: -1,
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
    socket.emit("user:error", { error: "Failed to create room." });
  }
};

export const join = async (
  socket: Socket,
  data: { name: string; roomId: string }
) => {
  const { name, roomId } = data;

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

  if (!room.public)
    return socket.emit("user:error", { error: "Room is not public." });

  for (const participant of room.participants) {
    if (participant.name === name) {
      return socket.emit("user:error", {
        error: "Name provided already exists in room.",
      });
    }
  }

  const maxParticipants = 10; // Example: limit of 10 participants per room
  if (room.participants.length >= maxParticipants)
    return socket.emit("user:error", { error: "Room is full." });

  const participantToken = new ObjectId();

  const newParticipant = {
    name,
    token: participantToken,
    score: 0,
    correctAnswers: 0,
    answers: 0,
  };

  room.participants.push(newParticipant);

  try {
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $set: { participants: room.participants } });

    socket.join(roomId);

    socket.emit("user:success", {
      message: "Room joined successfully.",
      participantToken,
    });

    sanitizeRoom(room);

    socket.to(roomId).emit("room:update", {
      participants: room.participants,
    });
    socket.emit("room:update", {
      participants: room.participants,
    });
  } catch (error) {
    console.error(error);
    socket.emit("user:error", { error: "Failed to join room." });
  }
};

export const kick = async (
  socket: Socket,
  data: { token: string; kick: string | undefined; roomId: string }
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

  const db = await connectToDatabase();
  const room = await db.collection<Room>(roomCollection).findOne({ roomId });

  if (!room) return socket.emit("user:error", { error: "Room not found." });

  if (token === room.host.toString()) {
    if (!kick) {
      try {
        await db.collection(roomCollection).deleteOne({ roomId });
        socket.emit("user:success", {
          message: "Successfully deleted room.",
        });
      } catch (error) {
        console.error(error);
        socket.emit("user:error", { error: "Failed to delete room." });
      }
    } else {
      if (!checkString(kick))
        return socket.emit("user:error", {
          error: "Kick is required and must be a non-empty string.",
        });

      try {
        const updatedParticipants = room.participants.filter(
          (participant: Participant) => !compareString(participant.name, kick)
        );

        if (updatedParticipants.length === room.participants.length)
          return socket.emit("user:error", {
            error: "Participant not found or already removed.",
          });

        await db
          .collection(roomCollection)
          .updateOne(
            { roomId },
            { $set: { participants: updatedParticipants } }
          );
        socket.emit("room:update", {
          message: `Participant '${kick}' removed successfully.`,
          participants: updatedParticipants,
        });
        return socket.to(roomId).emit("room:update", {
          message: `Participant '${kick}' removed successfully.`,
          participants: updatedParticipants,
        });
      } catch (error) {
        console.error(error);
        socket.emit("user:error", {
          error: `Failed to kick ${kick} from room.`,
        });
      }
    }
  } else {
    socket.emit("user:error", {
      error: "Only the host can use delete or kick.",
    });
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

    socket.join(roomId);
  } catch (error) {
    return socket.emit("user:error", {
      error: `Failed to reconnect to room ${roomId}.`,
    });
  }
};
