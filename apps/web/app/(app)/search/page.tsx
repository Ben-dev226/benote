import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { clean } from "@/lib/util";
import { KindTile } from "@/components/ui";
import { FileText } from "lucide-react";

export default async function Search({ searchParams }: { searchParams: { q?: string } }) {
  const { supabase } = await requireUser();
  const q = clean(searchParams.q ?? "");
  const [s, n, r] = q ? await Promise.all([
    supabase.from("learning_spaces").select("id,title,icon").ilike("title", `%${q}%`).limit(10),
    supabase.from("notes").select("id,title,content").or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(15),
    supabase.from("resources").select("id,name,kind").or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(15),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  return (
    <>
      <div className="page-h"><div><h1>Résultats pour « {q} »</h1><p>Apprentissages, notes et ressources.</p></div></div>
      <div className="grid">
        <div className="card"><h2>Apprentissages</h2>{(s.data ?? []).map((x: { id: string; title: string; icon: string | null }) => <Link key={x.id} className="li" href={`/spaces/${x.id}`}><span className="tile" style={{ background: "var(--sf2)" }}>{x.icon ?? "📘"}</span><span className="li-main"><b>{x.title}</b></span></Link>)}</div>
        <div className="card"><h2>Notes</h2>{(n.data ?? []).map((x: { id: string; title: string }) => <Link key={x.id} className="li" href={`/notes/${x.id}`}><span className="tile" style={{ background: "var(--sf2)" }}><FileText size={18} /></span><span className="li-main"><b>{x.title || "Sans titre"}</b></span></Link>)}</div>
        <div className="card"><h2>Ressources</h2>{(r.data ?? []).map((x: { id: string; name: string; kind: string }) => <Link key={x.id} className="li" href={`/library/${x.id}`}><KindTile kind={x.kind} /><span className="li-main"><b>{x.name}</b></span></Link>)}</div>
      </div>
    </>
  );
}
