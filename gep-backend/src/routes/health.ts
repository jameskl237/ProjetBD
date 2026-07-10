import { Router, type IRouter } from "express";
import { z } from "zod";

const HealthCheckResponse = z.object({ status: z.literal("ok") });

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    await (await import("@workspace/db")).db.execute("SELECT 1 AS ok");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ status: "error", database: "disconnected", detail: message });
  }
});

export default router;
