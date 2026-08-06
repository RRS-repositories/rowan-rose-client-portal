import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { clientRouter } from "./routes/client.js";
import { chatRouter, chatStaffRouter } from "./chat/routes.js";
import { initChat } from "./chat/index.js";
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
app.use("/client", clientRouter);
// Staff/CRM side (shared-secret auth) must mount before the client router,
// which requires a client JWT.
app.use("/api/chat/staff", chatStaffRouter);
app.use("/api/chat", chatRouter);

// Plain-English JSON errors (never leak stack traces to the client).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("unhandled error:", err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

// Socket.io needs the HTTP server, not the Express app — chat attaches to it.
// The portal backend MUST stay single-instance (see chat/index.js §2).
const httpServer = createServer(app);
initChat(httpServer, ORIGINS);

httpServer.listen(PORT, () => console.log(`✔ portal backend listening on http://localhost:${PORT}`));
