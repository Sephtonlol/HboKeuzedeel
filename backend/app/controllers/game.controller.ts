import { Request, response, Response } from "express";
import { Room } from "../../interfaces/rooms.interface";
import { connectToDatabase } from "../db";

const roomCollection = "rooms";

export const progressGame = async (req: Request, res: Response) => {
  const { token, roomId } = req.body;

  if (!roomId) return res.status(422).json({ error: "RoomId is required." });

  if (typeof roomId !== "number")
    return res.status(422).json({ error: "RoomId is must be of type number." });

  const db = await connectToDatabase();
  const room = await db
    .collection<Room>(roomCollection)
    .findOne({ roomId: roomId });

  if (!room) return res.status(404).json({ error: "Room not found." });

  if (room.host.toString() !== token)
    return res.status(401).json({ error: "Only the host can start the game." });

  if (!room.quiz || !room.quiz.questions) {
    return res.status(400).json({ error: "No quiz found for this room." });
  }

  const totalQuestions = room.quiz.questions.length;

  if (room.quizProgression >= totalQuestions) {
    return res.status(200).json({ message: "Quiz has ended." });
  }

  try {
    await db
      .collection(roomCollection)
      .updateOne({ roomId }, { $inc: { quizProgression: 1 } });

    res.status(200).json({
      message: "Next question started",
      quizProgression: room.quizProgression + 1,
      totalQuestions: totalQuestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start the game." });
  }
};
