import "dotenv/config";
import express from "express";
import { Request, Response } from "express";

const app = express();
const PORT = 3000;

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req: Request, res: Response) {
  console.log(req.body);
  res.json("yay");
});

app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
