import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Link2, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import ConfirmButton from "@/components/ConfirmButton";
import SubmitButton from "@/components/SubmitButton";
import { KindTile, SpaceChip } from "@/components/ui";
import { fmtDateTime, fmtTime } from "@/lib/util";
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
  const sl = (spaces.data ?? []) as { id: string; title: string }[];
  const tags = ((nt.data ?? []) as unknown as { tags: { name: string } | { name: string }[] | null }[]).map((r) => one(r.tags)?.name).filter(Boolean) as string[];
  const outs = (out.data ?? []) as unknown as { id: string; to_note_id: string; notes: T }[];
  const backs = (back.data ?? []) as unknown as { id: string; from_note_id: string; notes: T }[];
  const rls = (rl.data ?? []) as unknown as { id: string; page: number | null; timestamp_s: number | null; resources: { id: string; name: string; kind: string } | { id: string; name: string; kind: string }[] | null }[];
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row between">
        <div className="row"><Link href="/notes" className="btn ghost btn-sm" style={{ display: "inline-flex" }}><ArrowLeft size={15} /> Notes</Link>
          <SpaceChip space={sl.find((s) => s.id === n.space_id)} /></div>
        <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><ConfirmButton message="Supprimer cette note ?" className="btn-icon"><Trash2 size={16} /></ConfirmButton></form>
      </div>
      <NoteEditor key={searchParams.v ?? "x"} id={n.id} title={n.title} content={n.content} spaceId={n.space_id} favorite={n.favorite} tags={tags}
        spaces={sl} allTags={((allTags.data ?? []) as { name: string }[]).map((t) => t.name)} />

      <details className="acc" open={outs.length + backs.length > 0}>
        <summary>Notes liées ({outs.length + backs.length})</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          {outs.map((l) => (
            <div key={l.id} className="row between"><Link href={`/notes/${l.to_note_id}`} className="row"><Link2 size={14} /> {one(l.notes)?.title || "Sans titre"}</Link>
              <form action={removeNoteLink}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="from" value={n.id} /><button className="btn-icon" aria-label="Retirer">✕</button></form></div>
          ))}
          {backs.map((l) => <Link key={l.id} href={`/notes/${l.from_note_id}`} className="mu">← cité par {one(l.notes)?.title || "Sans titre"}</Link>)}
          <form action={addNoteLink} className="row"><input type="hidden" name="from" value={n.id} />
            <select name="to" style={{ flex: 1 }}><option value="">Lier à une note…</option>{(others.data ?? []).map((o: { id: string; title: string }) => <option key={o.id} value={o.id}>{o.title || "Sans titre"}</option>)}</select><SubmitButton className="btn btn-sm">Lier</SubmitButton></form>
        </div>
      </details>
      <details className="acc" open={rls.length > 0}>
        <summary>Ressources liées ({rls.length})</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          {rls.length === 0 && <span className="mu">Ouvre une ressource et ajoute une note depuis le lecteur : elle apparaîtra ici avec la page ou l’instant.</span>}
          {rls.map((l) => {
            const r = one(l.resources); if (!r) return null;
            const at = l.page ? `?page=${l.page}` : l.timestamp_s !== null ? `?t=${Math.floor(l.timestamp_s)}` : "";
            return <Link key={l.id} href={`/library/${r.id}${at}`} className="li"><KindTile kind={r.kind} /><span className="li-main"><b>{r.name}</b><span className="mu">{l.page ? `page ${l.page}` : l.timestamp_s !== null ? `à ${fmtTime(l.timestamp_s)}` : ""}</span></span></Link>;
          })}
        </div>
      </details>
      <details className="acc">
        <summary>Historique ({(vers.data ?? []).length})</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          {(vers.data ?? []).length === 0 && <span className="mu">Les anciennes versions apparaissent ici au fil de tes modifications.</span>}
          {(vers.data ?? []).map((v: { id: string; created_at: string }) => (
            <form key={v.id} action={restoreVersion} className="row between"><input type="hidden" name="note_id" value={n.id} /><input type="hidden" name="version_id" value={v.id} />
              <span className="mu">{fmtDateTime(v.created_at)}</span><SubmitButton className="btn ghost btn-sm">Restaurer</SubmitButton></form>
          ))}
        </div>
      </details>
    </div>
  );
}
