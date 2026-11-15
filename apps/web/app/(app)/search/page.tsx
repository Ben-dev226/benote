import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { clean, KIND_ICON } from "@/lib/util";

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
      <h1>Recherche : « {q} »</h1>
      <div className="grid">
        <div className="card"><h2>Apprentissages</h2>{(s.data ?? []).map((x: { id: string; title: string; icon: string | null }) => <Link key={x.id} className="item" href={`/spaces/${x.id}`}>{x.icon} {x.title}</Link>)}</div>
        <div className="card"><h2>Notes</h2>{(n.data ?? []).map((x: { id: string; title: string }) => <Link key={x.id} className="item" href={`/notes/${x.id}`}>📝 {x.title || "Sans titre"}</Link>)}</div>
        <div className="card"><h2>Ressources</h2>{(r.data ?? []).map((x: { id: string; name: string; kind: string }) => <Link key={x.id} className="item" href={`/library/${x.id}`}>{KIND_ICON[x.kind]} {x.name}</Link>)}</div>
      </div>
    </>
  );
}
