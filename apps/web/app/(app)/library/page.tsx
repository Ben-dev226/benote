import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { driveInfo } from "@/lib/google";
import { clean, fmtSize, KIND_ICON, KIND_LABEL } from "@/lib/util";
import { addLink } from "./actions";
import UploadForm from "./UploadForm";

type R = { id: string; name: string; kind: string; space_id: string | null; size_bytes: number | null; drive_status: string; url: string | null };

export default async function Library({ searchParams }: { searchParams: { kind?: string; q?: string; space?: string } }) {
  const { supabase, user } = await requireUser();
  const q = clean(searchParams.q ?? "");
  let query = supabase.from("resources").select("id,name,kind,space_id,size_bytes,drive_status,url").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.ilike("name", `%${q}%`);
  if (searchParams.kind) query = query.eq("kind", searchParams.kind);
  if (searchParams.space) query = query.eq("space_id", searchParams.space);
  const [res, spaces, prog, drive] = await Promise.all([
    query, supabase.from("learning_spaces").select("id,title").order("title"),
    supabase.from("resource_progress").select("resource_id,percent"), driveInfo(user.id),
  ]);
  const sl = (spaces.data ?? []) as { id: string; title: string }[];
  const pc = (id: string) => ((prog.data ?? []) as { resource_id: string; percent: number | null }[]).find((p) => p.resource_id === id)?.percent;
  return (
    <>
      <h1>Bibliothèque</h1>
      <div className="grid">
        {drive.status === "ok" ? <UploadForm spaces={sl} /> : (
          <div className="card stack"><h2>Fichiers</h2>
            <span className="mu">{drive.status === "config" ? "Google Drive n’est pas encore configuré sur ce serveur." : "Connecte ton Google Drive pour envoyer des fichiers."}</span>
            <Link className="btn" href="/settings">Aller aux paramètres</Link></div>
        )}
        <form action={addLink} className="card stack">
          <h2>Ajouter un lien ou une vidéo YouTube</h2>
          <input name="url" placeholder="https://…" required />
          <input name="name" placeholder="Nom (facultatif)" />
          <select name="space_id"><option value="">Sans apprentissage</option>{sl.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
          <button>Ajouter</button>
        </form>
      </div>
      <form className="row sec"><input name="q" defaultValue={searchParams.q ?? ""} placeholder="Rechercher une ressource" style={{ flex: 1 }} />
        <select name="kind" defaultValue={searchParams.kind ?? ""}><option value="">Tous types</option>
          {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select name="space" defaultValue={searchParams.space ?? ""}><option value="">Tous apprentissages</option>{sl.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <button className="ghost">Filtrer</button></form>
      <div className="card sec0">
        {((res.data ?? []) as R[]).map((r) => (
          <Link key={r.id} href={`/library/${r.id}`} className="row between item">
            <span>{KIND_ICON[r.kind]} {r.name} {r.drive_status === "missing" && <span className="err">⚠ absent de Drive</span>}</span>
            <span className="mu">{KIND_LABEL[r.kind]} · {sl.find((s) => s.id === r.space_id)?.title ?? "—"} {fmtSize(r.size_bytes)} {pc(r.id) != null ? `· ${pc(r.id)}%` : ""}</span>
          </Link>
        ))}
        {(res.data ?? []).length === 0 && <span className="mu">Aucune ressource.</span>}
      </div>
    </>
  );
}
