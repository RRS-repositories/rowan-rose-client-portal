#!/usr/bin/env node
/**
 * Terminal agent console — the staff side of a portal chat, for testing the
 * two-way connection before the CRM Customer Service Hub exists (Phase 3).
 *
 * Watches portal.chat_messages via LISTEN, prints client messages as they
 * arrive, and sends anything you type back as a human agent reply. It talks to
 * the same tables and the same NOTIFY bridge the CRM will use, so a clean run
 * here means the CRM↔portal pipe genuinely works.
 *
 * Run on the portal EC2:
 *   cd ~/rowan-rose-client-portal/backend
 *   node --env-file=.env tools/agent-console.mjs            # newest conversation
 *   node --env-file=.env tools/agent-console.mjs 1          # conversation 1
 *
 * Ctrl-C to quit.
 */
import readline from "node:readline";
import pg from "pg";

const { Client, Pool } = pg;
const AGENT_NAME = process.env.CHAT_AGENT_NAME || "Claims team";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const time = (d) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function render(m) {
  const who =
    m.sender_type === "client" ? cyan("CLIENT ") :
    m.sender_type === "agent" ? green("YOU    ") :
    m.sender_type === "hermes" ? bold("SARAH  ") : dim("SYSTEM ");
  process.stdout.write(`\r${who} ${dim(time(m.created_at))}  ${m.body}\n> `);
}

async function pickConversation(argId) {
  if (argId) {
    const { rows } = await pool.query("SELECT * FROM chat_conversations WHERE id = $1", [argId]);
    if (!rows[0]) throw new Error(`conversation ${argId} not found`);
    return rows[0];
  }
  const { rows } = await pool.query(
    "SELECT * FROM chat_conversations ORDER BY last_message_at DESC NULLS LAST, id DESC LIMIT 1",
  );
  if (!rows[0]) throw new Error("no conversations yet — open the Chat tab in the portal first");
  return rows[0];
}

async function main() {
  const conversation = await pickConversation(process.argv[2]);
  console.log(bold(`\nPortal chat — conversation ${conversation.id}`));
  console.log(dim(`contact ${conversation.contact_id} · claim ${conversation.claim_id ?? "general"} · status ${conversation.status}`));
  console.log(dim("Type a reply and press Enter. Ctrl-C to quit.\n"));

  const { rows: history } = await pool.query(
    "SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY id",
    [conversation.id],
  );
  history.forEach(render);

  // Live tail via the same NOTIFY the portal listens on.
  const listener = new Client({ connectionString: process.env.DATABASE_URL });
  await listener.connect();
  await listener.query("LISTEN chat_message");
  listener.on("notification", async (msg) => {
    try {
      const { message_id, conversation_id } = JSON.parse(msg.payload);
      if (String(conversation_id) !== String(conversation.id)) return;
      const { rows } = await pool.query("SELECT * FROM chat_messages WHERE id = $1", [message_id]);
      // Our own replies are echoed locally on send; don't print them twice.
      if (rows[0] && rows[0].sender_type !== "agent") render(rows[0]);
    } catch { /* ignore malformed payloads */ }
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
  rl.prompt();
  rl.on("line", async (line) => {
    const body = line.trim();
    if (!body) return rl.prompt();
    try {
      // Claiming the conversation also keeps Sarah silent in it from now on.
      await pool.query(
        `UPDATE chat_conversations
            SET status = 'human_active', updated_at = now()
          WHERE id = $1 AND status <> 'human_active'`,
        [conversation.id],
      );
      const { rows } = await pool.query(
        `INSERT INTO chat_messages (conversation_id, sender_type, body, meta)
         VALUES ($1, 'agent', $2, $3::jsonb) RETURNING *`,
        [conversation.id, body, JSON.stringify({ agentName: AGENT_NAME })],
      );
      render(rows[0]);
    } catch (err) {
      console.error(`\n[send failed] ${err.message}`);
      rl.prompt();
    }
  });
  rl.on("close", async () => {
    await listener.end().catch(() => {});
    await pool.end().catch(() => {});
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
