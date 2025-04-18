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

    const usernameExist = await db
      .collection(userCollection)
      .findOne({ "user.username": username });

    const emailExist = await db
      .collection(userCollection)
      .findOne({ "user.email": email });

    if (usernameExist)
      return res
        .status(419)
        .json({ error: "User with that name already exists" });

    if (emailExist)
      return res
        .status(419)
        .json({ error: "User with that email already exists" });

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
  const { email, password } = req.body;

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

    const result = await db
      .collection(userCollection)
      .findOne({ "user.email": email });

    if (!result) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, result.user.password);
    if (!match) return res.status(422).json({ error: "Incorrect password" });
    let token: string;
    let tokenCheckResult;
    do {
      token = crypto.randomBytes(32).toString("hex");
      tokenCheckResult = await db
        .collection(userCollection)
        .findOne({ "user.token": token });
    } while (tokenCheckResult);
    await db
      .collection(userCollection)
      .updateOne({ "user.email": email }, { $set: { "user.token": token } });

    res.json({
      message: "Logged in",
      token,
      username: result.user.username,
      userId: result._id,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};

export const verifyToken = async (
  authHeader: string | undefined
): Promise<any> => {
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Authorization header is missing or invalid.");
    }
    const token = authHeader.split(" ")[1];

    const db = await connectToDatabase();
    const result = await db.collection(userCollection).findOne({
      "user.token": token,
    });

    if (!result) {
      return false;
    }

    return result.user;
  } catch (error: any) {
    console.error("Error during token verification:", error);
    return false;
  }
};

export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return token || null;
};

export const user = async (req: Request, res: Response) => {
  try {
    const verifiedUser = await verifyToken(req.headers.authorization);

    if (!verifiedUser) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const { password, token, ...userWithoutSensitiveData } = verifiedUser;
    res.json({ user: userWithoutSensitiveData });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "An error occurred whilst retrieving user." });
  }
};
