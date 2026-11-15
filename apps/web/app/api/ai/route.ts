import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AGENTS } from "@/lib/ai/agents";
import { availableProviders, complete, GatewayError } from "@/lib/ai/gateway";

export const maxDuration = 30;

const LIMIT_PER_HOUR = 30;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const b = await request.json().catch(() => null) as { agent?: string; prompt?: string; noteId?: string } | null;
  const agent = b?.agent && AGENTS[b.agent] ? b.agent : null;
  const prompt = (b?.prompt ?? "").trim().slice(0, 4000);
  if (!agent || !prompt) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const { data: st } = await supabase.from("user_settings").select("ai_enabled").maybeSingle();
  if (!st?.ai_enabled) return NextResponse.json({ error: "L’assistant IA est désactivé (Paramètres)." }, { status: 403 });
  if (!availableProviders().length) return NextResponse.json({ error: "Aucun fournisseur IA configuré." }, { status: 503 });

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from("ai_tasks").select("id", { count: "exact", head: true }).gte("created_at", since);
  if ((count ?? 0) >= LIMIT_PER_HOUR) return NextResponse.json({ error: "Limite horaire atteinte, réessaie plus tard." }, { status: 429 });

  let context = "";
  if (b?.noteId) {
    const { data: n } = await supabase.from("notes").select("title,content").eq("id", b.noteId).maybeSingle();
    if (n) context = `\n\nNote « ${n.title} » :\n${String(n.content).slice(0, 6000)}`;
  }
  const { data: ag } = await supabase.from("ai_agents").select("id").eq("slug", agent).maybeSingle();
  try {
    const out = await complete(AGENTS[agent].system, prompt + context);
    await supabase.from("ai_tasks").insert({ user_id: user.id, agent_id: ag?.id ?? null, status: "done", input: { prompt, noteId: b?.noteId ?? null }, output: out });
    return NextResponse.json(out);
  } catch (e) {
    const attempts = e instanceof GatewayError ? e.attempts : [];
    await supabase.from("ai_tasks").insert({ user_id: user.id, agent_id: ag?.id ?? null, status: "failed", input: { prompt }, output: { attempts } });
    return NextResponse.json({ error: "Aucun fournisseur IA n’a répondu. Le reste de l’application fonctionne normalement.", attempts }, { status: 503 });
  }
}
