import { Request, Response } from "express";
import { connectToDatabase } from "../db";
import { Quiz } from "../../interfaces/quiz.interface";
import { ObjectId } from "mongodb";
import { checkObjectId, checkString } from "../utils/types.utils";
import { sanitizeQuiz, sanitizeQuizzes } from "../utils/sanitize.utils";
import { verifyToken } from "./account.controller";

const quizCollection = "quizzes";

export const createQuiz = async (req: Request, res: Response) => {
  const { name, createdBy, createdAt, description, questions } = req.body;
  try {
    const db = await connectToDatabase();

    const isAuthorized = await verifyToken(req.headers.authorization);
    if (!isAuthorized) return res.status(401).json({ error: "Unauthorized" });

    if (!checkString(name))
      return res.status(422).json({
        error: "Quiz name is required and must be a non-empty string.",
      });

    if (!checkString(description))
      return res.status(422).json({
        error: "Description is required and must be a non-empty string.",
      });

    if (!Array.isArray(questions) || questions.length === 0)
      return res
        .status(422)
        .json({ error: "At least one question is required." });

    for (const [index, question] of questions.entries()) {
      const { name, type, answers } = question;

      if (!checkString(name))
        return res.status(422).json({
          error: `Question ${
            index + 1
          } name is required and must be a non-empty string.`,
        });

      if (!type || !["yes_no", "multiple_choice", "open"].includes(type))
        return res.status(422).json({
          error: `Question ${
            index + 1
          } type is required and must be one of "yes_no", "multiple_choice", or "open".`,
        });

      if (!answers)
        return res
          .status(422)
          .json({ error: `Question ${index + 1} must have answers.` });

      switch (type) {
        case "yes_no":
          if (typeof answers.correctAnswer !== "boolean")
            return res.status(422).json({
              error: `Question ${
                index + 1
              } 'yes_no' answer must have a valid 'correctAnswer' boolean.`,
            });
          break;

        case "multiple_choice":
          if (!Array.isArray(answers.options) || answers.options.length < 2)
            return res.status(422).json({
              error: `Question ${
                index + 1
              } 'multiple_choice' must have at least two options.`,
            });
          if (
            !answers.correctAnswer ||
            !answers.options.includes(answers.correctAnswer)
          )
            return res.status(422).json({
              error: `Question ${
                index + 1
              } 'multiple_choice' must have a valid 'correctAnswer' that is one of the options.`,
            });
          break;

        case "open":
          if (
            typeof answers.correctAnswer !== "string" ||
            answers.correctAnswer.trim().length === 0
          )
            return res.status(422).json({
              error: `Question ${
                index + 1
              } 'open' answer must have a valid 'correctAnswer' string.`,
            });
          break;

        default:
          return res
            .status(422)
            .json({ error: `Question ${index + 1} has an invalid type.` });
      }
    }

    const quiz: Quiz = { name, description, createdAt, createdBy, questions };

    const result = await db.collection(quizCollection).insertOne(quiz);
    return res.status(201).json({
      message: "Successfully created quiz.",
      quizId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create room." });
  }
};

export const getQuiz = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const quizId = req.query.quizId || "";

  try {
    const db = await connectToDatabase();
    if (typeof page !== "number" || page < 1)
      return res.status(422).json({ error: "Invalid page." });
    if (quizId) {
      if (!checkObjectId(quizId))
        return res.status(422).json({ error: "Invalid quizId." });
      const fetchedQuiz = await db
        .collection<Quiz>(quizCollection)
        .findOne({ _id: new ObjectId(quizId as string) });

      if (!fetchedQuiz) return res.json({ error: "Could not find quiz." });

      const sanitizedQuiz = sanitizeQuiz(fetchedQuiz);

      return res.json(sanitizedQuiz);
    }
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalQuizzes = await db
      .collection<Quiz>(quizCollection)
      .countDocuments();
    const maxPage = Math.ceil(totalQuizzes / limit);

    if (page > maxPage)
      return res
        .status(422)
        .json({ error: "Page exceeds maximum page index." });

    const fetchedQuizzes = await db
      .collection<Quiz>(quizCollection)
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    const sanitizedQuizzes = sanitizeQuizzes(fetchedQuizzes);

    return res.json({ maxPage, quizzes: sanitizedQuizzes });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return res.status(500).json({ error: "Failed to fetch quiz." });
  }
};
