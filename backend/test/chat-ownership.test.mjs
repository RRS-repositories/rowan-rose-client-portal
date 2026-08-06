/**
 * Cross-contact isolation test — spec §10's first acceptance criterion.
 *
 * "A client typing another conversation id must get FORBIDDEN, and there must
 * be a test asserting exactly that." This is that test. It runs against the
 * live backend with two real sessions, so it exercises the actual socket auth
 * path rather than a mock of it.
 *
 * Run:  node --env-file=.env test/chat-ownership.test.mjs
 * Env:  CHAT_TEST_EMAIL_A / CHAT_TEST_PASSWORD_A  (owns a conversation)
 *       CHAT_TEST_EMAIL_B / CHAT_TEST_PASSWORD_B  (the prober; optional —
 *       without B we still assert that a made-up id is refused for A)
 */
import assert from "node:assert/strict";
import { io } from "socket.io-client";

const BASE = process.env.CHAT_TEST_BASE || "http://127.0.0.1:4000";

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  assert.ok(body.token, `login failed for ${email}: ${body.message || res.status}`);
  return body.token;
}

function connect(token) {
  const socket = io(BASE, { auth: { token }, transports: ["websocket"] });
  return new Promise((resolve, reject) => {
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (e) => reject(new Error(`connect_error: ${e.message}`)));
    setTimeout(() => reject(new Error("connect timeout")), 10_000);
  });
}

const once = (socket, event, ms = 10_000) =>
  new Promise((resolve, reject) => {
    socket.once(event, resolve);
    setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
  });

async function main() {
  // ── A opens their own conversation ──
  const tokenA = await login(process.env.CHAT_TEST_EMAIL_A, process.env.CHAT_TEST_PASSWORD_A);
  const a = await connect(tokenA);
  a.emit("conversation:open", { claimId: null });
  const opened = await once(a, "conversation:opened");
  const conversationId = opened.conversation.id;
  console.log(`✔ A opened conversation ${conversationId}`);

  // ── A probes a conversation id that isn't theirs → FORBIDDEN ──
  a.emit("conversation:sync", { conversationId: Number(conversationId) + 999_999, sinceMessageId: 0 });
  const strayErr = await once(a, "chat:error");
  assert.equal(strayErr.code, "FORBIDDEN", `expected FORBIDDEN, got ${strayErr.code}`);
  console.log("✔ A refused a conversation id that isn't theirs");

  // ── B probes A's real conversation → FORBIDDEN (the real breach case) ──
  if (process.env.CHAT_TEST_EMAIL_B) {
    const tokenB = await login(process.env.CHAT_TEST_EMAIL_B, process.env.CHAT_TEST_PASSWORD_B);
    const b = await connect(tokenB);

    b.emit("conversation:sync", { conversationId, sinceMessageId: 0 });
    const syncErr = await once(b, "chat:error");
    assert.equal(syncErr.code, "FORBIDDEN", "B must not read A's conversation");

    b.emit("message:send", { conversationId, body: "probe", clientMsgUuid: crypto.randomUUID() });
    const sendErr = await once(b, "chat:error");
    assert.equal(sendErr.code, "FORBIDDEN", "B must not post into A's conversation");

    console.log("✔ B refused read AND write on A's conversation");
    b.close();
  } else {
    console.log("• skipped cross-account probe (set CHAT_TEST_EMAIL_B to enable)");
  }

  // ── An unauthenticated socket cannot connect at all ──
  await assert.rejects(connect("not-a-real-token"), /connect_error/, "bad token must be rejected");
  console.log("✔ invalid token rejected at the handshake");

  a.close();
  console.log("\nAll ownership assertions passed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
