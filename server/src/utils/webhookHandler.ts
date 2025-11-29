// utils/webhookHandler.ts
import { Request, Response, NextFunction } from "express";

export const webhookHandler = (
  fn: (req: Request, res: Response) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (error) {
      // DÙ LỖI GÌ CŨNG PHẢI TRẢ 200 CHO STRIPE
      console.error("[WebhookHandler] Error:", error);
      res.status(200).send("OK");
    }
  };
};