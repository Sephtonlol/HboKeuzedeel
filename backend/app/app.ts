import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes/app.routes";

const PORT = process.env.APP_PORT;
const app = express();

app.use(
  cors({
    origin: process.env.APP_BASE_URL, // Frontend rest-api
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.listen(PORT, () => {
  console.log("App listening on PORT", PORT);
});
