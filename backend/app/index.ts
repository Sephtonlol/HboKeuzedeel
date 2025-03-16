import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import { createRoom, joinRoom } from "./controllers/room.controller";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.post("/room", async (req: Request, res: Response) => {
  createRoom(req, res);
});

app.get("/room", async (req: Request, res: Response) => {
  joinRoom(req, res);
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
