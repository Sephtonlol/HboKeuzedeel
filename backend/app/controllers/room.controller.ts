import { Request, Response } from "express";
import { connectToDatabase } from "../db";
import { Participant, Room } from "../../interfaces/rooms.interface";
import { ObjectId } from "mongodb";

const collection = "rooms";

export const createRoom = async (req: Request, res: Response) => {
  const { name, public: _public } = req.query;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res
      .status(422)
      .json({ error: "Name is required and must be a non-empty string." });
  }

  const db = await connectToDatabase();
  const rooms = await db.collection(collection).find().toArray();

  const typedRooms: Room[] = rooms.map((room) => ({
    roomId: room.roomId,
    participants: room.participants,
    public: true,
  }));

  const roomNumbers: number[] = typedRooms.map((doc) => doc.roomId);

  let roomNumber;
  do {
    roomNumber = Math.floor(Math.random() * 9999);
  } while (roomNumbers.includes(roomNumber));

  const participant: Participant = {
    name: name as string,
    correctAnswers: 0,
    score: 0,
  };

  const newRoom: Room = {
    roomId: roomNumber,
    participants: [participant],
    public: _public == "true" ? true : false,
  };

  try {
    await db.collection(collection).insertOne(newRoom);
    return res.json({
      message: `Successfully created ${
        _public === "true" ? "public" : "private"
      } room`,
      roomNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create room" });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  const { name, roomId } = req.query;

  if (!name || typeof name !== "string" || name.trim().length === 0)
    return res
      .status(422)
      .json({ error: "Name is required and must be a non-empty string." });

  if (!roomId) return res.status(422).json({ error: "Room is required" });

  const db = await connectToDatabase();
  const room = await db
    .collection<Room>(collection)
    .findOne({ roomId: Number(roomId) });

  if (!room) return res.status(404).json({ error: "Room not found" });

  if (!room.public)
    return res.status(403).json({ error: "Room is not public" });

  for (const participant of room.participants) {
    if (participant.name == name)
      return res
        .status(409)
        .json({ error: "Name provided already exists in room" });
  }

  const maxParticipants = 10; // Example: limit of 10 participants per room TODO
  if (room.participants.length >= maxParticipants)
    return res.status(403).json({ error: "Room is full" });

  const newParticipant = { name: String(name), score: 0, correctAnswers: 0 };
  room.participants.push(newParticipant);

  try {
    await db
      .collection(collection)
      .updateOne(
        { roomId: Number(roomId) },
        { $set: { participants: room.participants } }
      );

    res.status(201).json({ message: "Joined room successfully", roomId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to join room" });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  const { roomId } = req.query;

  try {
    const db = await connectToDatabase();

    if (roomId) {
      const parsedRoomId = parseInt(roomId as string, 10);
      if (isNaN(parsedRoomId)) {
        return res.status(400).json({ error: "Invalid room ID format" });
      }

      const fetchedRoom = await db
        .collection<Room>(collection)
        .findOne({ roomId: parsedRoomId, public: true });

      if (!fetchedRoom) {
        return res.status(404).json({ error: "Room not found or not public" });
      }

      return res.status(200).json(fetchedRoom);
    }

    const fetchedRooms = await db
      .collection<Room>(collection)
      .find({ public: true })
      .toArray();

    return res.status(200).json(fetchedRooms);
  } catch (error) {
    console.error("Error fetching room:", error);
    return res.status(500).json({ error: "Failed to fetch room" });
  }
};
