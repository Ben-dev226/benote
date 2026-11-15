import { requireUser } from "@/lib/auth";
import KnowledgeMap from "./KnowledgeMap";

export default async function MapPage() {
  const { supabase } = await requireUser();
  const [notes, links, spaces] = await Promise.all([
    supabase.from("notes").select("id,title,space_id").limit(300),
    supabase.from("note_links").select("from_note_id,to_note_id"),
    supabase.from("learning_spaces").select("id").order("created_at"),
  ]);
  const sIds = ((spaces.data ?? []) as { id: string }[]).map((s) => s.id);
  const nodes = ((notes.data ?? []) as { id: string; title: string; space_id: string | null }[]).map((n) => ({ id: n.id, title: n.title, group: Math.max(0, sIds.indexOf(n.space_id ?? "")) }));
  const ls = ((links.data ?? []) as { from_note_id: string; to_note_id: string }[]).map((l) => ({ a: l.from_note_id, b: l.to_note_id }));
  return (
    <>
      <h1>Carte de connaissances</h1>
      <p className="mu">Chaque point est une note (couleur = apprentissage). Les traits sont les liens entre notes ; clique pour ouvrir.</p>
      <KnowledgeMap nodes={nodes} links={ls} />
    </>
  );
}
