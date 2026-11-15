export type Attempt = { provider: string; model?: string; error: string };
export class GatewayError extends Error {
  attempts: Attempt[];
  constructor(attempts: Attempt[]) { super("Aucun fournisseur disponible"); this.attempts = attempts; }
}

type Provider = { name: string; chat: string; models: string; key?: string; model?: string };

function all(): Provider[] {
  return [
    { name: "Groq", chat: "https://api.groq.com/openai/v1/chat/completions", models: "https://api.groq.com/openai/v1/models", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL },
    { name: "Gemini", chat: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", models: "https://generativelanguage.googleapis.com/v1beta/openai/models", key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL },
    { name: "OpenRouter", chat: "https://openrouter.ai/api/v1/chat/completions", models: "https://openrouter.ai/api/v1/models", key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL },
  ];
}
export const availableProviders = () => all().filter((p) => p.key?.trim()).map((p) => p.name);

const DEFAULTS: Record<string, string> = { Groq: "llama-3.3-70b-versatile", Gemini: "gemini-2.0-flash", OpenRouter: "meta-llama/llama-3.3-70b-instruct:free" };

async function discover(p: Provider): Promise<string[]> {
  try {
    const res = await fetch(p.models, { headers: { Authorization: `Bearer ${p.key!.trim()}` }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    const ids: string[] = (json?.data ?? []).map((m: { id: string }) => String(m.id).replace(/^models\//, ""));
    const bad = /whisper|guard|tts|playai|orpheus|embed|image|vision-preview|audio|live|imagen|veo|moderation/i;
    let picks: string[];
    if (p.name === "Groq") picks = ids.filter((i) => !bad.test(i) && /llama|gpt-oss|qwen|kimi/i.test(i)).sort((a, b) => Number(/70b|120b|versatile/i.test(b)) - Number(/70b|120b|versatile/i.test(a)));
    else if (p.name === "Gemini") picks = ids.filter((i) => /^gemini-[\d.]+-flash/i.test(i) && !bad.test(i) && !/exp|preview|thinking/i.test(i)).sort().reverse();
    else picks = ids.filter((i) => i.endsWith(":free") && /llama|gemini|gpt-oss|qwen|mistral|deepseek/i.test(i)).sort((a, b) => Number(/llama|gpt-oss/i.test(b)) - Number(/llama|gpt-oss/i.test(a)));
    return picks.slice(0, 2);
  } catch {
    return [];
  }
}

function explain(status: number, body: string) {
  let msg = "";
  try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.[0]?.error?.message ?? ""; } catch { msg = body; }
  msg = String(msg).replace(/\s+/g, " ").slice(0, 140);
  if (status === 401 || status === 403) return `clé refusée (${status}) ${msg}`;
  if (status === 429) return `quota gratuit atteint (429) ${msg}`;
  if (status === 404 || status === 400) return `modèle indisponible (${status}) ${msg}`;
  return `erreur ${status} ${msg}`;
}

async function call(p: Provider, model: string, system: string, user: string) {
  const res = await fetch(p.chat, {
    method: "POST", headers: { Authorization: `Bearer ${p.key!.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 1200 }),
    signal: AbortSignal.timeout(12000),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false as const, status: res.status, error: explain(res.status, body) };
  try {
    const text = JSON.parse(body)?.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) return { ok: true as const, text };
  } catch { /* réponse illisible */ }
  return { ok: false as const, status: 0, error: "réponse vide" };
}

// Essaie chaque fournisseur configuré ; si le modèle n'existe plus, en découvre un autre automatiquement.
export async function complete(system: string, user: string) {
  const attempts: Attempt[] = [];
  const deadline = Date.now() + 24000;
  for (const p of all().filter((x) => x.key?.trim())) {
    if (Date.now() > deadline) break;
    const first = p.model?.trim() || DEFAULTS[p.name];
    try {
      let r = await call(p, first, system, user);
      if (r.ok) return { text: r.text, provider: p.name, model: first };
      attempts.push({ provider: p.name, model: first, error: r.error });
      if (r.status === 400 || r.status === 404) {
        for (const m of (await discover(p)).filter((x) => x !== first)) {
          if (Date.now() > deadline) break;
          r = await call(p, m, system, user);
          if (r.ok) return { text: r.text, provider: p.name, model: m };
          attempts.push({ provider: p.name, model: m, error: r.error });
        }
      }
    } catch {
      attempts.push({ provider: p.name, model: first, error: "injoignable (délai dépassé)" });
    }
  }
  throw new GatewayError(attempts);
}
