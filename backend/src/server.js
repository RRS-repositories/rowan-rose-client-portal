import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { pool } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim());

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

app.use("/auth", authRouter);

// Plain-English JSON errors (never leak stack traces to the client).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("unhandled error:", err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

app.listen(PORT, () => console.log(`✔ portal backend listening on http://localhost:${PORT}`));
