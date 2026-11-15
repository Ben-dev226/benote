import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AGENTS } from "@/lib/ai/agents";
import { availableProviders } from "@/lib/ai/gateway";
import Chat from "./Chat";

export default async function Assistant() {
  const { supabase } = await requireUser();
  const [st, notes] = await Promise.all([
    supabase.from("user_settings").select("ai_enabled").maybeSingle(),
    supabase.from("notes").select("id,title").order("updated_at", { ascending: false }).limit(100),
  ]);
  const providers = availableProviders();
  return (
    <>
      <h1>✨ Assistant IA <span className="tag">facultatif</span></h1>
      {!st.data?.ai_enabled ? (
        <div className="card stack"><span>L’assistant est désactivé. Tout le reste de myNotebook fonctionne sans lui.</span><Link className="btn" href="/settings">Activer dans les paramètres</Link></div>
      ) : providers.length === 0 ? (
        <div className="card">Aucun fournisseur IA gratuit n’est configuré sur ce serveur (clés GROQ / GEMINI / OPENROUTER dans les variables d’environnement).</div>
      ) : (
        <>
          <p className="mu">Fournisseurs disponibles : {providers.join(", ")} (bascule automatique en cas d’indisponibilité).</p>
          <Chat agents={Object.entries(AGENTS).map(([slug, a]) => ({ slug, label: a.label }))} notes={(notes.data ?? []) as { id: string; title: string }[]} />
        </>
      )}
    </>
  );
}
