import { Request, Response } from "express";
import { connectToDatabase } from "../db";
import { Participant, Room } from "../../interfaces/rooms.interface";
import { ObjectId } from "mongodb";
import { Quiz } from "../../interfaces/quiz.interface";

const roomCollection = "rooms";
const quizCollection = "quizzes";

export const createRoom = async (req: Request, res: Response) => {
  const { name, quizId, public: _public } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res
      .status(422)
      .json({ error: "Name is required and must be a non-empty string." });
  }

  if (!quizId)
    return res
      .status(422)
      .json({ error: "quizId is required to create a room." });

  if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) {
    return res.status(422).json({ error: "Invalid quiz Id." });
  }

  const db = await connectToDatabase();

  const quiz = await db
    .collection<Quiz>(quizCollection)
    .findOne({ _id: new ObjectId(quizId) });

  if (!quiz) {
    return res.status(404).json({ error: "Could not find quiz." });
  }
  const typedQuiz: Quiz = {
    _id: quiz._id,
    name: quiz.name,
    questions: quiz.questions,
  };

  const rooms = await db.collection(roomCollection).find().toArray();

  const typedRooms: Room[] = rooms.map((room) => ({
    roomId: room.roomId,
    participants: room.participants,
    host: room.host,
    public: true,
    quizProgression: -1,
  }));

  const roomNumbers: number[] = typedRooms.map((doc) => doc.roomId);

  let roomNumber;
  do {
    roomNumber = Math.floor(Math.random() * 9999);
  } while (roomNumbers.includes(roomNumber) || roomNumber < 999);

  const userToken = new ObjectId();

  const participant: Participant = {
    name: name as string,
    token: userToken,
    score: 0,
    correctAnswers: 0,
    answers: 0,
  };

  const newRoom: Room = {
    roomId: roomNumber,
    participants: [participant],
    host: userToken,
    public: _public,
    quiz: typedQuiz,
    quizProgression: -1,
  };

  try {
    await db.collection(roomCollection).insertOne(newRoom);
    return res.status(201).json({
      message: `Successfully created ${
        _public === true ? "public" : "private"
      } room`,
      roomId: roomNumber,
      token: userToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create room." });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  const { name, roomId } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0)
    return res
      .status(422)
      .json({ error: "Name is required and must be a non-empty string." });

  if (!roomId) return res.status(422).json({ error: "RoomId is required." });

  if (typeof roomId !== "number")
    return res.status(422).json({ error: "RoomId is must be of type number." });

  const db = await connectToDatabase();
  const room = await db
    .collection<Room>(roomCollection)
    .findOne({ roomId: roomId });

  if (!room) return res.status(404).json({ error: "Room not found." });

  if (!room.public)
    return res.status(403).json({ error: "Room is not public." });

  for (const participant of room.participants) {
    if (participant.name == name)
      return res
        .status(409)
        .json({ error: "Name provided already exists in room." });
  }

  const maxParticipants = 10; // Example: limit of 10 participants per room TODO
  if (room.participants.length >= maxParticipants)
    return res.status(403).json({ error: "Room is full." });

  const participantToken = new ObjectId();

  const newParticipant = {
    name: name,
    token: participantToken,
    score: 0,
    correctAnswers: 0,
    answers: 0,
  };
  room.participants.push(newParticipant);

  try {
    await db
      .collection(roomCollection)
      .updateOne(
        { roomId: Number(roomId) },
        { $set: { participants: room.participants } }
      );

    res
      .status(201)
      .json({ message: "Joined room successfully.", roomId, participantToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to join room." });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  const { roomId } = req.body;

  try {
    const db = await connectToDatabase();

    if (roomId) {
      const parsedRoomId = parseInt(roomId as string, 10);
      if (isNaN(parsedRoomId)) {
        return res.status(422).json({ error: "Invalid room ID format." });
      }

      const fetchedRoom = await db
        .collection<Room>(roomCollection)
        .findOne({ roomId: parsedRoomId, public: true });

      if (!fetchedRoom) {
        return res.status(404).json({ error: "Room not found or not public." });
      }

      const sortedParticipants = fetchedRoom.participants.sort(
        (a: Participant, b: Participant) => b.score - a.score
      );

      const sanitizedRoom = {
        ...fetchedRoom,
        host: undefined,
        participants: sortedParticipants.map(({ token, ...rest }) => rest),
      };

      return res.status(200).json(sanitizedRoom);
    }

    const fetchedRooms = await db
      .collection<Room>(roomCollection)
      .find({ public: true })
      .toArray();

    const sanitizedRooms = fetchedRooms.map((room) => {
      const sortedParticipants = room.participants.sort(
        (a: Participant, b: Participant) => b.score - a.score
      );

      return {
        ...room,
        host: undefined,
        participants: sortedParticipants.map(({ token, ...rest }) => rest),
      };
    });

    return res.status(200).json(sanitizedRooms);
  } catch (error) {
    console.error("Error fetching room:", error);
    return res.status(500).json({ error: "Failed to fetch room." });
  }
};

export const kickRoom = async (req: Request, res: Response) => {
  const { token, kick, roomId } = req.body;

  const db = await connectToDatabase();
  const room = await db.collection(roomCollection).findOne({ roomId: roomId });
  if (!room) return res.status(404).json({ error: "Room not found." });
  if (token == room.host.toString()) {
    if (!kick) {
      try {
        await db.collection(roomCollection).deleteOne({ roomId: roomId });
        return res.status(200).json({ error: "Successfully deleted room" });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to delete room" });
      }
    }
    try {
      const updatedParticipants = room.participants.filter(
        (participant: Participant) => participant.name !== kick
      );

      if (updatedParticipants.length === room.participants.length) {
        return res
          .status(404)
          .json({ error: "Participant not found or already removed." });
      }
      res
        .status(200)
        .json({ message: `Participant '${kick}' removed successfully.` });

      if (updatedParticipants.length === room.participants.length) {
        return res
          .status(404)
          .json({ error: "Participant not found or already removed." });
      }

      await db
        .collection(roomCollection)
        .updateOne({ roomId }, { $set: { participants: updatedParticipants } });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: `Failed to kick ${kick} from room` });
    }
  } else {
    return res
      .status(403)
      .json({ error: "Only the host can delete the room." });
  }
};
