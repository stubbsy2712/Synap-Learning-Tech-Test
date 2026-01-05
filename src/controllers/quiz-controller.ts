import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

type CreateQuizBody = {
  title: unknown;
  description: unknown;
  candidateInstructions: unknown;
};

type QuizDocument = {
  title: string;
  description: string;
  candidateInstructions: string;
  createdAt: Date;
  updatedAt: Date;
};

export class QuizController {
  public validateQuizStructure(
    body: CreateQuizBody,
    res: Response,
    now: Date,
    existingCreatedAt?: Date
  ): QuizDocument | null {
    if (
      typeof body.title !== "string" ||
      typeof body.description !== "string" ||
      typeof body.candidateInstructions !== "string"
    ) {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [
          {
            detail:
              "Invalid request body. Expected title, description and candidateInstructions as strings.",
          },
        ],
      });
      return null;
    }
  
    return {
      title: body.title,
      description: body.description,
      candidateInstructions: body.candidateInstructions,
      createdAt: existingCreatedAt ?? now,
      updatedAt: now,
    };
  }

  public createQuiz(req: Request, res: Response) {
  const body = req.body as CreateQuizBody;

  if (
    typeof body.title !== "string" ||
    typeof body.description !== "string" ||
    typeof body.candidateInstructions !== "string"
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      errors: [
        {
          detail:
            "Invalid request body. Expected title, description and candidateInstructions as strings.",
        },
      ],
    });
    return;
  }

  const quiz: QuizDocument = {
    title: body.title,
    description: body.description,
    candidateInstructions: body.candidateInstructions,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  getDb()
    .then((db) =>
      db.collection<QuizDocument>("quizzes").insertOne(quiz)
    )
    .then((result) => {
      res.status(StatusCodes.CREATED).json({
        data: {
          type: "quizzes",
          id: result.insertedId.toString(),
          attributes: {
            title: quiz.title,
            description: quiz.description,
            candidateInstructions: quiz.candidateInstructions,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
          },
        },
      });
    })
    .catch((err) => {
      console.error("createQuiz error:", err);
      res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  }

  public getQuizById(req: Request, res: Response) {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    res.status(StatusCodes.BAD_REQUEST).json({
      errors: [{ detail: "Invalid quiz id" }],
    });
    return;
  }

  getDb()
    .then((db) =>
      db
        .collection<QuizDocument>("quizzes")
        .findOne({ _id: new ObjectId(id) })
    )
    .then((quiz) => {
      if (!quiz) {
        res.status(StatusCodes.NOT_FOUND).json({
          errors: [{ detail: "Quiz not found" }],
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        data: {
          type: "quizzes",
          id: quiz._id.toString(),
          attributes: {
            title: quiz.title,
            description: quiz.description,
            candidateInstructions: quiz.candidateInstructions,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
          },
        },
      });
    })
    .catch((err) => {
      console.error("getQuizById error:", err);
      res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  }

  public getQuizzes(req: Request, res: Response) {
      console.log("getQuizzes");
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);

	  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    res.status(StatusCodes.BAD_REQUEST).json({
      errors: [{ detail: "Invalid quiz id" }],
    });
    return;
  }

  getDb()
    .then((db) =>
      db
        .collection<QuizDocument>("quizzes")
        .findOne({ _id: new ObjectId(id) })
    )
    .then((quiz) => {
      if (!quiz) {
        res.status(StatusCodes.NOT_FOUND).json({
          errors: [{ detail: "Quiz not found" }],
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        data: {
          type: "quizzes",
          id: quiz._id.toString(),
          attributes: {
            title: quiz.title,
            description: quiz.description,
            candidateInstructions: quiz.candidateInstructions,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
          },
        },
      });
    })
    .catch((err) => {
      console.error("getQuizById error:", err);
      res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  }

  public updateQuiz(req: Request, res: Response) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [{ detail: "Invalid quiz id" }],
      });
      return;
    }

    const body = req.body as CreateQuizBody;
    const now = new Date();
    const quizId = new ObjectId(id);

    getDb()
      .then((db) =>
        db
          .collection<QuizDocument>("quizzes")
          .findOne({ _id: quizId })
          .then((existing) => ({ db, existing }))
      )
      .then(({ db, existing }) => {
        if (!existing) {
          res.status(StatusCodes.NOT_FOUND).json({
            errors: [{ detail: "Quiz not found" }],
          });
          return null;
        }

        const validated = this.validateQuizStructure(body, res, now, (existing as any).createdAt);
        if (!validated) return null;

        return db
          .collection<QuizDocument>("quizzes")
          .updateOne({ _id: quizId }, { $set: validated })
          .then((updateResult) => {
            if (updateResult.matchedCount === 0) return null;
            return db.collection<QuizDocument>("quizzes").findOne({ _id: quizId });
          });
      })
      .then((updated) => {
        if (!updated) {
          if (!res.headersSent) {
            res.status(StatusCodes.NOT_FOUND).json({
              errors: [{ detail: "Quiz not found" }],
            });
          }
          return;
        }

        res.status(StatusCodes.OK).json({
          data: {
            type: "quizzes",
            id: updated._id.toString(),
            attributes: {
              title: updated.title,
              description: updated.description,
              candidateInstructions: updated.candidateInstructions,
              createdAt: updated.createdAt,
              updatedAt: updated.updatedAt,
            },
          },
        });
      })
      .catch((err) => {
        console.error("updateQuiz error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }

  public deleteQuiz(req: Request, res: Response) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [{ detail: "Invalid quiz id" }],
      });
      return;
    }

    const quizId = new ObjectId(id);

    getDb()
      .then((db) => db.collection<QuizDocument>("quizzes").deleteOne({ _id: quizId }))
      .then((result) => {
        if (result.deletedCount === 0) {
          res.status(StatusCodes.NOT_FOUND).json({
            errors: [{ detail: "Quiz not found" }],
          });
          return;
        }

        res.sendStatus(StatusCodes.NO_CONTENT);
      })
      .catch((err) => {
        console.error("deleteQuiz error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }
}