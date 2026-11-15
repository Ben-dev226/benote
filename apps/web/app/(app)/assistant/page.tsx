import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AGENTS } from "@/lib/ai/agents";
import { availableProviders } from "@/lib/ai/gateway";
import Chat from "./Chat";

export default async function Assistant({ searchParams }: { searchParams: { agent?: string; q?: string } }) {
  const { supabase } = await requireUser();
  const [st, notes, hist] = await Promise.all([
    supabase.from("user_settings").select("ai_enabled").maybeSingle(),
    supabase.from("notes").select("id,title").order("updated_at", { ascending: false }).limit(100),
    supabase.from("ai_tasks").select("input,output,created_at").eq("status", "done").order("created_at", { ascending: false }).limit(5),
  ]);
  const providers = availableProviders();
  const initial = ((hist.data ?? []) as { input: { prompt?: string } | null; output: { text?: string; provider?: string } | null }[]).reverse()
    .flatMap((t) => [{ role: "user" as const, text: t.input?.prompt ?? "" }, { role: "ai" as const, text: `${t.output?.text ?? ""}\n\n— ${t.output?.provider ?? ""}` }]);
  return (
    <>
      <div className="page-h"><div><h1>Assistant IA <span className="tag">facultatif</span></h1><p>Un coup de main pour comprendre, résumer ou réviser — l’application fonctionne très bien sans lui.</p></div></div>
      {!st.data?.ai_enabled ? (
        <div className="card stack"><span>L’assistant est désactivé.</span><Link className="btn" href="/settings" style={{ alignSelf: "flex-start" }}>Activer dans les paramètres</Link></div>
      ) : providers.length === 0 ? (
        <div className="card">Aucun fournisseur IA gratuit n’est configuré sur ce serveur (variables GROQ_API_KEY, GEMINI_API_KEY ou OPENROUTER_API_KEY, puis redéploiement).</div>
      ) : (
        <>
          <p className="mu">Fournisseurs configurés : {providers.join(", ")} — bascule automatique si l’un est indisponible.</p>
          <Chat agents={Object.entries(AGENTS).map(([slug, a]) => ({ slug, label: a.label }))} notes={(notes.data ?? []) as { id: string; title: string }[]}
            initial={initial.filter((m) => m.text.trim())} presetAgent={searchParams.agent} presetPrompt={searchParams.q} />
        </>
      )}
    </>
  );
}
