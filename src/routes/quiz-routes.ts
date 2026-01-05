import { Router } from "express";
import { QuizController } from "../controllers/quiz-controller.js";

const router = Router();

router.post("/quizzes", (_req, res) => {
  const controller = new QuizController();
  controller.createQuiz(_req, res);
});

router.get("/quizzes/:id", (_req, res) => {
  const controller = new QuizController();
  controller.getQuizById(_req, res);
});

router.get("/quizzes", (_req, res) => {
  const controller = new QuizController();
  controller.getQuizzes(_req, res);
});

router.patch("/quizzes/:id", (_req, res) => {
  const controller = new QuizController();
  controller.updateQuiz(_req, res);
});

router.delete("/quizzes/:id", (_req, res) => {
  const controller = new QuizController();
  controller.deleteQuiz(_req, res);
});

export {router as quizRoutes};