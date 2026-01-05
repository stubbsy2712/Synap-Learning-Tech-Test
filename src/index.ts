import express from "express";
import { questionRoutes } from "./routes/question-routes.js";
import { quizRoutes } from "./routes/quiz-routes.js";

const appServer = express();

appServer.use(express.json());

appServer.use(questionRoutes);
appServer.use(quizRoutes);

appServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});