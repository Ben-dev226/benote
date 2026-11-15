import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { clean, fmtDate } from "@/lib/util";
import { createNote } from "./actions";

type N = { id: string; title: string; content: string; favorite: boolean; space_id: string | null; updated_at: string };

export default async function Notes({ searchParams }: { searchParams: { q?: string; space?: string; tag?: string; fav?: string } }) {
  const { supabase } = await requireUser();
  const q = clean(searchParams.q ?? "");
  let ids: string[] | null = null;
  if (searchParams.tag) {
    const { data: t } = await supabase.from("tags").select("id").eq("name", searchParams.tag).maybeSingle();
    const { data: nt } = t ? await supabase.from("note_tags").select("note_id").eq("tag_id", t.id) : { data: [] };
    ids = (nt ?? []).map((x: { note_id: string }) => x.note_id);
  }
  let query = supabase.from("notes").select("id,title,content,favorite,space_id,updated_at").order("favorite", { ascending: false }).order("updated_at", { ascending: false }).limit(100);
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  if (searchParams.space) query = query.eq("space_id", searchParams.space);
  if (searchParams.fav) query = query.eq("favorite", true);
  if (ids) query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const [notes, spaces, tags, nt] = await Promise.all([
    query, supabase.from("learning_spaces").select("id,title").order("title"), supabase.from("tags").select("name").order("name"),
    supabase.from("note_tags").select("note_id,tags(name)"),
  ]);
  const sname = (id: string | null) => ((spaces.data ?? []) as { id: string; title: string }[]).find((s) => s.id === id)?.title;
  const tagsOf = (id: string) => ((nt.data ?? []) as unknown as { note_id: string; tags: { name: string } | { name: string }[] | null }[])
    .filter((r) => r.note_id === id).map((r) => (Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name)).filter(Boolean) as string[];
  return (
    <>
      <div className="head"><h1>Mes notes</h1>
        <form action={createNote}><button>+ Nouvelle note</button></form></div>
      <form className="row sec0">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Rechercher dans les notes" style={{ flex: 1 }} />
        <select name="space" defaultValue={searchParams.space ?? ""}><option value="">Tous les apprentissages</option>
          {(spaces.data ?? []).map((s: { id: string; title: string }) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <label className="row"><input type="checkbox" name="fav" value="1" defaultChecked={!!searchParams.fav} style={{ width: "auto" }} /> ⭐</label>
        <button className="ghost">Filtrer</button>
      </form>
      <div className="row sec0">{(tags.data ?? []).map((t: { name: string }) => <Link key={t.name} className="tag" href={`/notes?tag=${encodeURIComponent(t.name)}`}>#{t.name}</Link>)}</div>
      <div className="grid">
        {((notes.data ?? []) as N[]).map((n) => (
          <Link key={n.id} href={`/notes/${n.id}`} className="card">
            <b>{n.favorite ? "⭐ " : ""}{n.title || "Sans titre"}</b>
            <div className="mu clamp">{n.content.slice(0, 140)}</div>
            <div className="row">{tagsOf(n.id).map((t) => <span key={t} className="tag">#{t}</span>)}</div>
            <div className="mu">{sname(n.space_id) ?? "—"} · {fmtDate(n.updated_at)}</div>
          </Link>
        ))}
        {(notes.data ?? []).length === 0 && <div className="card mu">Aucune note.</div>}
      </div>
    </>
  );
}
