import type { Request, Response, NextFunction } from "express";

type SafeParseSuccess = { success: true; data: unknown; error?: never };
type SafeParseFailure = { success: false; data?: never; error: { flatten?: () => unknown } };
type SafeParseSchema = {
  safeParse(data: unknown): SafeParseSuccess | SafeParseFailure;
};

export function validate(schema: SafeParseSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Données invalides", details: result.error.flatten?.() });
      return;
    }
    req.body = result.data;
    next();
  };
}
