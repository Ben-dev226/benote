type Provider = { name: string; url: string; key?: string; model: string };

function all(): Provider[] {
  return [
    { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile" },
    { name: "Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash" },
    { name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free" },
  ];
}
export const availableProviders = () => all().filter((p) => p.key).map((p) => p.name);

// Essaie chaque fournisseur configuré dans l'ordre ; bascule au suivant en cas d'erreur ou de quota dépassé.
export async function complete(system: string, user: string) {
  const errors: string[] = [];
  for (const p of all().filter((x) => x.key)) {
    try {
      const res = await fetch(p.url, {
        method: "POST", headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 1200 }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) { errors.push(`${p.name}: ${res.status}`); continue; }
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) return { text: text as string, provider: p.name };
      errors.push(`${p.name}: réponse vide`);
    } catch {
      errors.push(`${p.name}: indisponible`);
    }
  }
  throw new Error(errors.length ? errors.join(" | ") : "Aucun fournisseur IA configuré");
}
