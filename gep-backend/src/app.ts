import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.ts";
import healthRouter from "./routes/health.ts";
import { logger } from "./lib/logger.ts";

const app: Express = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res: any) { return { statusCode: res.statusCode }; },
    },
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(healthRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

export default app;
