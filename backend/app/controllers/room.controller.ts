import { Request, Response } from "express";
import { connectToDatabase } from "../db";
import { Participant, Room } from "../../interfaces/rooms.interface";

const roomsCollection = "rooms";

export const createRoom = async (req: Request, res: Response) => {
  const { name, public: _public } = req.query;

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
    if (_public === "true") {
      res.json({ name, roomNumber });
      return;
    }
    res.json({ name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create room" });
  }
};
