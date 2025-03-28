import { Request, Response } from "express";
import { connectToDatabase } from "../db";
import { Room } from "../../interfaces/room.interface";
import {
  sanitizeQuiz,
  sanitizeRoom,
  sanitizeRooms,
} from "../utils/sanitize.utils";
import { checkRoomId } from "../utils/types.utils";

const roomCollection = "rooms";

export const getRoom = async (req: Request, res: Response) => {
  const { roomId } = req.body;

  try {
    const db = await connectToDatabase();

    if (roomId) {
      if (!checkRoomId(roomId))
        return res.status(422).json({ error: "Invalid room ID format." });

      const fetchedRoom = await db
        .collection<Room>(roomCollection)
        .findOne({ roomId: roomId, public: true });

      if (!fetchedRoom)
        return res.status(404).json({ error: "Room not found or not public." });
      if (!fetchedRoom.quiz)
        return res.status(404).json({ error: "No quiz found in this room." });

      fetchedRoom.quiz = sanitizeQuiz(fetchedRoom.quiz);

      return res.status(200).json(sanitizeRoom(fetchedRoom));
    }

    const fetchedRooms = await db
      .collection<Room>(roomCollection)
      .find({ public: true })
      .toArray();

    return res.status(200).json(sanitizeRooms(fetchedRooms));
  } catch (error) {
    console.error("Error fetching room:", error);
    return res.status(500).json({ error: "Failed to fetch room." });
  }
};
