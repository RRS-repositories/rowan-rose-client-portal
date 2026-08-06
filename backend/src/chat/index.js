/**
 * Chat bootstrap: attaches Socket.io to the existing HTTP server, wires auth +
 * handlers, starts the orphaned-run recovery sweep.
 *
 * SINGLE-PROCESS CONSTRAINT (Notes/Chat/CHAT_ARCHITECTURE.md §2): Socket.io
 * holds connections in per-process memory. More than one PM2 instance means
 * silently undelivered messages. The portal backend must stay exec_mode fork,
 * instances 1 — the guard below makes a misconfiguration fail loudly at boot
 * instead. (The main CRM's ~20-worker ecosystem config must never be copied
 * here.) When the portal genuinely needs horizontal scale, the fix is
 * @socket.io/postgres-adapter — until then, the DB is the only state.
 */
import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import { registerHandlers } from "./handlers.js";
import { startRecovery } from "./recovery.js";
import { startListener } from "./listener.js";

export function initChat(httpServer, corsOrigins) {
  if (process.env.NODE_APP_INSTANCE && Number(process.env.NODE_APP_INSTANCE) > 0) {
    throw new Error("Chat requires single-instance mode — see Notes/Chat/CHAT_ARCHITECTURE.md §2");
  }

  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
    maxHttpBufferSize: 64 * 1024, // chat payloads are small; cap abuse
  });

  io.use(socketAuth);
  io.on("connection", (socket) => registerHandlers(io, socket));
  startRecovery(io);
  // Delivers messages written by ANY writer (CRM, staff API, raw SQL).
  startListener(io);

  console.log("✔ chat socket layer attached");
  return io;
}
