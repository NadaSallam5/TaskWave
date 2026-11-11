// apps/api/src/app.js
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import workerRoutes from "./routes/workers.js";
import eventRoutes from "./routes/events.js";
import { authenticate } from "./middleware/auth.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.use("/auth", authRoutes);
app.use("/jobs", authenticate, jobRoutes);
app.use("/workers", workerRoutes);
app.use("/events", eventRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({ error: message });
});

export default app;
