import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ConfirmButton from "@/components/ConfirmButton";
import { fmtDateTime, fmtTime, KIND_ICON } from "@/lib/util";
import { addNoteLink, deleteNote, removeNoteLink, restoreVersion } from "../actions";
import NoteEditor from "./NoteEditor";

type T = { title: string } | { title: string }[] | null;
const one = <X,>(v: X | X[] | null) => (Array.isArray(v) ? v[0] : v);

export default async function NotePage({ params, searchParams }: { params: { id: string }; searchParams: { v?: string } }) {
  const { supabase } = await requireUser();
  const { data: n } = await supabase.from("notes").select("id,title,content,space_id,favorite").eq("id", params.id).maybeSingle();
  if (!n) notFound();
  const [spaces, nt, allTags, out, back, rl, vers, others] = await Promise.all([
    supabase.from("learning_spaces").select("id,title").order("title"),
    supabase.from("note_tags").select("tags(name)").eq("note_id", n.id),
    supabase.from("tags").select("name"),
    supabase.from("note_links").select("id,to_note_id,notes!note_links_to_note_id_fkey(title)").eq("from_note_id", n.id),
    supabase.from("note_links").select("id,from_note_id,notes!note_links_from_note_id_fkey(title)").eq("to_note_id", n.id),
    supabase.from("resource_links").select("id,page,timestamp_s,resources(id,name,kind)").eq("note_id", n.id),
    supabase.from("note_versions").select("id,created_at").eq("note_id", n.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("notes").select("id,title").neq("id", n.id).order("title").limit(200),
  ]);
  const tags = ((nt.data ?? []) as unknown as { tags: { name: string } | { name: string }[] | null }[]).map((r) => one(r.tags)?.name).filter(Boolean) as string[];
  return (
    <>
      <div className="head"><h1>Note</h1><Link href="/notes" className="btn ghost">← Notes</Link></div>
      <div className="split">
        <NoteEditor key={searchParams.v ?? "x"} id={n.id} title={n.title} content={n.content} spaceId={n.space_id} favorite={n.favorite} tags={tags}
          spaces={(spaces.data ?? []) as { id: string; title: string }[]} allTags={((allTags.data ?? []) as { name: string }[]).map((t) => t.name)} />
        <div className="stack">
          <div className="card stack"><h2>Notes liées</h2>
            {((out.data ?? []) as unknown as { id: string; to_note_id: string; notes: T }[]).map((l) => (
              <div key={l.id} className="row between"><Link href={`/notes/${l.to_note_id}`}>→ {one(l.notes)?.title || "Sans titre"}</Link>
                <form action={removeNoteLink}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="from" value={n.id} /><button className="ghost">✕</button></form></div>
            ))}
            {((back.data ?? []) as unknown as { id: string; from_note_id: string; notes: T }[]).map((l) => (
              <Link key={l.id} href={`/notes/${l.from_note_id}`} className="mu">← {one(l.notes)?.title || "Sans titre"}</Link>
            ))}
            <form action={addNoteLink} className="row"><input type="hidden" name="from" value={n.id} />
              <select name="to" style={{ flex: 1 }}><option value="">Lier à une note…</option>
                {(others.data ?? []).map((o: { id: string; title: string }) => <option key={o.id} value={o.id}>{o.title || "Sans titre"}</option>)}</select><button>Lier</button></form>
          </div>
          <div className="card stack"><h2>Ressources liées</h2>
            {(rl.data ?? []).length === 0 && <span className="mu">Aucune. Crée une note depuis un lecteur pour la lier.</span>}
            {((rl.data ?? []) as unknown as { id: string; page: number | null; timestamp_s: number | null; resources: { id: string; name: string; kind: string } | { id: string; name: string; kind: string }[] | null }[]).map((l) => {
              const r = one(l.resources); if (!r) return null;
              const at = l.page ? `?page=${l.page}` : l.timestamp_s !== null ? `?t=${Math.floor(l.timestamp_s)}` : "";
              return <Link key={l.id} href={`/library/${r.id}${at}`}>{KIND_ICON[r.kind]} {r.name} <span className="mu">{l.page ? `p. ${l.page}` : l.timestamp_s !== null ? fmtTime(l.timestamp_s) : ""}</span></Link>;
            })}
          </div>
          <div className="card stack"><h2>Historique</h2>
            {(vers.data ?? []).length === 0 && <span className="mu">Pas encore de version.</span>}
            {(vers.data ?? []).map((v: { id: string; created_at: string }) => (
              <form key={v.id} action={restoreVersion} className="row between"><input type="hidden" name="note_id" value={n.id} /><input type="hidden" name="version_id" value={v.id} />
                <span className="mu">{fmtDateTime(v.created_at)}</span><button className="ghost">Restaurer</button></form>
            ))}
          </div>
          <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><ConfirmButton message="Supprimer cette note ?" className="danger">Supprimer la note</ConfirmButton></form>
        </div>
      </div>
    </>
  );
}
