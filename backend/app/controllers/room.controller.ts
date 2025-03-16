import { Request, Response } from "express";
import { connectToDatabase } from "../db";
import { Participant, Room } from "../../interfaces/rooms.interface";

const roomsCollection = "rooms";

export const createRoom = async (req: Request, res: Response) => {
  const { name, public: _public } = req.query;

  if (!name) return res.status(422).json({ error: "Name is required" });

  const db = await connectToDatabase();
  const rooms = await db.collection(roomsCollection).find().toArray();

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
    await db.collection(roomsCollection).insertOne(newRoom);
    if (_public === "true") return res.json({ name, roomNumber });
    res.json({ name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create room" });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  const { name, roomId } = req.query;

  if (!name || !roomId)
    return res.status(422).json({ error: "Name & Room are required" });

  const db = await connectToDatabase();
  const room: Room = (await db
    .collection(roomsCollection)
    .findOne({ roomId: Number(roomId) })) as Room;

  if (!room) return res.status(404).json({ error: "Room not found" });

  if (!room.public) return res.status(403).json({ error: "Room isn't public" });

  for (const participant of room.participants) {
    if (participant.name == name)
      return res
        .status(409)
        .json({ error: "Name provided already exists in room" });
  }

  const maxParticipants = 10; // Example: limit of 10 participants per room
  if (room.participants.length >= maxParticipants)
    return res.status(403).json({ error: "Room is full" });

  const newParticipant = { name: String(name), score: 0, correctAnswers: 0 };
  room.participants.push(newParticipant);

  try {
    await db
      .collection(roomsCollection)
      .updateOne(
        { roomId: Number(roomId) },
        { $set: { participants: room.participants } }
      );

    res.status(200).json({ message: "Joined room successfully", room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to join room" });
  }
};
