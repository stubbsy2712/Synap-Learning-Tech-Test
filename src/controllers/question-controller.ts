import type {Application, Request, Response} from "express";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

type QuestionKind = "free_text" | "multiple_choice";

type BaseQuestion = {
  prompt: string;
  kind: QuestionKind;
  createdAt: Date;
  updatedAt: Date;
};

type FreeTextQuestion = BaseQuestion & {
  kind: "free_text";
};

type MultipleChoiceQuestion = BaseQuestion & {
  kind: "multiple_choice";
  options: Record<string, string>; // { A: "Answer", B: "Answer" }
  correctOptionKey: string; // "A", "B", etc.
};

type CreateQuestionBody = {
  kind?: QuestionKind;
  prompt?: string;
  options?: string;
  correctOptionKey?: string;
};

type QuestionDocument = FreeTextQuestion | MultipleChoiceQuestion;

export class QuestionController {
  public validateQuestionStructure(
    body: CreateQuestionBody,
    res: Response,
    now: Date,
    existingCreatedAt?: Date
  ): QuestionDocument | null {
    // Basic shared validation
    if (typeof body.kind !== "string" || typeof body.prompt !== "string") {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [{ detail: "Invalid request body" }],
      });
      return null;
    }
  
    const createdAt = existingCreatedAt ?? now;
  
    if (body.kind === "free_text") {
      return {
        kind: "free_text",
        prompt: body.prompt,
        createdAt,
        updatedAt: now,
      };
    }
  
    if (body.kind === "multiple_choice") {
      // validate options structure and correctOptionKey value
      if (
        typeof body.options !== "object" ||
        body.options === null ||
        Array.isArray(body.options)
      ) {
        res.status(StatusCodes.BAD_REQUEST).json({
          errors: [{ detail: "options must be an object of key/value pairs" }],
        });
        return null;
      }
  
      const optionEntries = Object.entries(body.options);
  
      if (optionEntries.length < 2) {
        res.status(StatusCodes.BAD_REQUEST).json({
          errors: [{ detail: "At least two options are required" }],
        });
        return null;
      }
  
      for (const [key, value] of optionEntries) {
        if (typeof key !== "string" || typeof value !== "string") {
          res.status(StatusCodes.BAD_REQUEST).json({
            errors: [{ detail: "Option keys and values must be strings" }],
          });
          return null;
        }
      }
  
      if (
        typeof body.correctOptionKey !== "string" ||
        !(body.correctOptionKey in body.options)
      ) {
        res.status(StatusCodes.BAD_REQUEST).json({
          errors: [{ detail: "correctOptionKey must match one of the option keys" }],
        });
        return null;
      }
  
      return {
        kind: "multiple_choice",
        prompt: body.prompt,
        options: body.options as Record<string, string>,
        correctOptionKey: body.correctOptionKey,
        createdAt,
        updatedAt: now,
      };
    }
  
    res.status(StatusCodes.BAD_REQUEST).json({
      errors: [{ detail: "Invalid question kind" }],
    });
    return null;
  }

  public createQuestion(req: Request, res: Response) {
    const body = req.body as CreateQuestionBody;
    const now = new Date();

    const question = this.validateQuestionStructure(body, res, now);
    if (!question) return;

    getDb()
      .then((db) => db.collection<QuestionDocument>("questions").insertOne(question))
      .then((result) => {
        if (question.kind === "multiple_choice") {
          res.status(StatusCodes.CREATED).json({
            data: {
              type: "questions",
              id: result.insertedId.toString(),
              attributes: {
                kind: question.kind,
                prompt: question.prompt,
                options: question.options,
                correctOptionKey: question.correctOptionKey,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
              },
            },
          });
        } else {
          res.status(StatusCodes.CREATED).json({
            data: {
              type: "questions",
              id: result.insertedId.toString(),
              attributes: {
                kind: question.kind,
                prompt: question.prompt,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
              },
            },
          });
        }
      })
      .catch((err) => {
        console.error("createQuestion error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }

  public getQuestionById(req: Request, res: Response) {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [{ detail: "Invalid question id" }],
      });
      return;
    }

    getDb()
      .then((db) =>
        db
          .collection<QuestionDocument>("questions")
          .findOne({ _id: new ObjectId(id) })
      )
      .then((question) => {
        if (!question) {
          res.status(StatusCodes.NOT_FOUND).json({
            errors: [{ detail: "Question not found" }],
          });
          return;
        }

        if (question.kind === "multiple_choice") {
          res.status(StatusCodes.OK).json({
            data: {
              type: "questions",
              id: question._id.toString(),
              attributes: {
                kind: question.kind,
                prompt: question.prompt,
                options: question.options,
                correctOptionKey: question.correctOptionKey,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
              },
            },
          });
        } else {
          res.status(StatusCodes.OK).json({
            data: {
              type: "questions",
              id: question._id.toString(),
              attributes: {
                kind: question.kind,
                prompt: question.prompt,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
              },
            },
          });
        }
      })
      .catch((err) => {
        console.error("getQuestionById error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }

  public getQuestions(req: Request, res: Response) {
    getDb()
      .then((db) => db.collection<QuestionDocument>("questions").find({}).toArray())
      .then((questions) => {
        res.status(StatusCodes.OK).json({
          data: questions.map((q: any) => {
            if (q.kind === "multiple_choice") {
              return {
                type: "questions",
                id: q._id.toString(),
                attributes: {
                  kind: q.kind,
                  prompt: q.prompt,
                  options: q.options,
                  correctOptionKey: q.correctOptionKey,
                  createdAt: q.createdAt,
                  updatedAt: q.updatedAt,
                },
              };
            }

            return {
              type: "questions",
              id: q._id.toString(),
              attributes: {
                kind: q.kind,
                prompt: q.prompt,
                createdAt: q.createdAt,
                updatedAt: q.updatedAt,
              },
            };
          }),
        });
      })
      .catch((err) => {
        console.error("getQuestions error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }

  public updateQuestion(req: Request, res: Response) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [{ detail: "Invalid question id" }],
      });
      return;
    }

    const body = req.body as CreateQuestionBody;
    const now = new Date();

    getDb()
      .then((db) =>
        db
          .collection<QuestionDocument>("questions")
          .findOne({ _id: new ObjectId(id) })
          .then((existing) => ({ db, existing }))
      )
      .then(({ db, existing }) => {
        if (!existing) {
          res.status(StatusCodes.NOT_FOUND).json({
            errors: [{ detail: "Question not found" }],
          });
          return null;
        }

        const validated = this.validateQuestionStructure(body, res, now, (existing as any).createdAt);
        if (!validated) return null;

        return db
          .collection<QuestionDocument>("questions")
          .updateOne(
              { _id: new ObjectId(id) },
              { $set: validated }
            )
            .then((updateResult) => {
              if (updateResult.matchedCount === 0) {
                return null;
              }
              return db
                .collection<QuestionDocument>("questions")
                .findOne({ _id: new ObjectId(id) });
            });
      })
      .then((updated) => {
        if (!updated) {
          res.status(StatusCodes.NOT_FOUND).json({
            errors: [{ detail: "Question not found" }],
          });
          return;
        }
        if (updated.kind === "multiple_choice") {
          res.status(StatusCodes.OK).json({
            data: {
              type: "questions",
              id: updated._id.toString(),
              attributes: {
                kind: updated.kind,
                prompt: updated.prompt,
                options: updated.options,
                correctOptionKey: updated.correctOptionKey,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
              },
            },
          });
        } else {
          res.status(StatusCodes.OK).json({
            data: {
              type: "questions",
              id: updated._id.toString(),
              attributes: {
                kind: updated.kind,
                prompt: updated.prompt,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
              },
            },
          });
        }
      })
      .catch((err) => {
        console.error("updateQuestion error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }

  public deleteQuestion(req: Request, res: Response) {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        errors: [{ detail: "Invalid question id" }],
      });
      return;
    }

    getDb()
      .then((db) =>
        db
          .collection<QuestionDocument>("questions")
          .deleteOne({ _id: new ObjectId(id) })
      )
      .then((result) => {
        if (result.deletedCount === 0) {
          res.status(StatusCodes.NOT_FOUND).json({
            errors: [{ detail: "Question not found" }],
          });
          return;
        }

        res.sendStatus(StatusCodes.NO_CONTENT);
      })
      .catch((err) => {
        console.error("deleteQuestion error:", err);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      });
  }
}