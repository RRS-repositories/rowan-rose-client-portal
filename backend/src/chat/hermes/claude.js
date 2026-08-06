/**
 * Anthropic SDK wrapper. Non-streaming in Phase 1 (streaming is spec Phase 2).
 *
 * One retry on 429/5xx with jitter, then fail — and every failure path returns
 * rather than throws, because the agent's contract is "fail safe to handoff,
 * never to silence".
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.HERMES_MODEL || "claude-sonnet-4-6";
const MAX_TOKENS = Number(process.env.HERMES_MAX_TOKENS || 1024);
const TIMEOUT_MS = 30_000;

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: TIMEOUT_MS,
      maxRetries: 0, // retry policy is ours (below), so failures stay observable
    });
  }
  return client;
}

export const claudeEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One completion. `history` is [{role:'user'|'assistant', content:string}].
 * Returns { ok:true, text, usage, model } or { ok:false, error }.
 */
export async function complete({ system, history }) {
  const anthropic = getClient();
  if (!anthropic) return { ok: false, error: "no_api_key" };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: history,
      });
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return {
        ok: true,
        text,
        model: res.model,
        usage: {
          input_tokens: res.usage?.input_tokens ?? null,
          output_tokens: res.usage?.output_tokens ?? null,
        },
      };
    } catch (err) {
      const status = err?.status;
      const retryable = status === 429 || (status >= 500 && status < 600) || err?.name === "APIConnectionError";
      if (retryable && attempt === 0) {
        await sleep(400 + Math.floor(Math.random() * 600));
        continue;
      }
      return { ok: false, error: `${err?.name || "error"}: ${err?.message || "unknown"}` };
    }
  }
  return { ok: false, error: "exhausted" };
}
