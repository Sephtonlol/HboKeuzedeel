import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { connectToDatabase } from "../db";
import { checkString } from "../utils/types.utils";
import crypto from "crypto";
import { User } from "../../interfaces/user.interface";

const userCollection = "users";

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!checkString(username))
    return res
      .status(422)
      .json({ error: "Username is required and must be a string." });

  if (!checkString(email))
    return res
      .status(422)
      .json({ error: "Email is required and must be a string." });

  if (!checkString(password))
    return res
      .status(422)
      .json({ error: "Password is required and must be a string." });

  try {
    const db = await connectToDatabase();

    const existing = await db
      .collection(userCollection)
      .findOne({ "user.username": username });

    if (existing) return res.status(419).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user: User = {
      username,
      email,
      password: hash,
    };

    await db.collection(userCollection).insertOne({ user });

    res.json({ message: "User registered" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!checkString(username))
    return res
      .status(422)
      .json({ error: "Username is required and must be a string." });

  if (!checkString(password))
    return res
      .status(422)
      .json({ error: "Password is required and must be a string." });

  try {
    const db = await connectToDatabase();

    const result = await db
      .collection(userCollection)
      .findOne({ "user.username": username });

    if (!result) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, result.user.password);
    if (!match) return res.status(422).json({ error: "Incorrect password" });

    const token = crypto.randomBytes(32).toString("hex");
    await db
      .collection(userCollection)
      .updateOne(
        { "user.username": username },
        { $set: { "user.token": token } }
      );

    res.json({ message: "Logged in", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};

export const user = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!checkString(token))
    return res
      .status(422)
      .json({ error: "Token is required and must be a string." });

  try {
    const db = await connectToDatabase();

    const result = await db
      .collection(userCollection)
      .findOne({ "user.token": token });

    if (!result) return res.status(404).json({ error: "User not found" });
    const { password, ...user } = result.user;
    res.json({ user });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred whilst retrieving user." });
  }
};
