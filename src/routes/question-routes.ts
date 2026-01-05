import { Router } from "express";
import { QuestionController } from "../controllers/question-controller.js";

const router = Router();

router.post("/questions", (_req, res) => {
  const controller = new QuestionController();
  controller.createQuestion(_req, res);
});

router.get("/questions/:id", (_req, res) => {
  const controller = new QuestionController();
  controller.getQuestionById(_req, res);
});

router.get("/questions", (_req, res) => {
  const controller = new QuestionController();
  controller.getQuestions(_req, res);
});

router.patch("/questions/:id", (_req, res) => {
  const controller = new QuestionController();
  controller.updateQuestion(_req, res);
});

router.delete("/questions/:id", (_req, res) => {
  const controller = new QuestionController();
  controller.deleteQuestion(_req, res);
});

export {router as questionRoutes};