import Link from "next/link";
import { FolderOpen, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { driveInfo } from "@/lib/google";
import { Empty, KindTile, SpaceChip } from "@/components/ui";
import { clean, fmtDate, fmtSize, KIND_LABEL } from "@/lib/util";
import AddResource from "./AddResource";

type R = { id: string; name: string; kind: string; space_id: string | null; size_bytes: number | null; drive_status: string; created_at: string };
const TABS: [string, string][] = [["", "Toutes"], ["document", "Documents"], ["video", "Vidéos"], ["audio", "Audio"], ["image", "Images"], ["link", "Liens"]];

export default async function Library({ searchParams }: { searchParams: { kind?: string; q?: string; space?: string; add?: string } }) {
  const { supabase, user } = await requireUser();
  const q = clean(searchParams.q ?? "");
  let query = supabase.from("resources").select("id,name,kind,space_id,size_bytes,drive_status,created_at").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.ilike("name", `%${q}%`);
  if (searchParams.kind) query = query.eq("kind", searchParams.kind);
  if (searchParams.space) query = query.eq("space_id", searchParams.space);
  const [res, spaces, prog, drive] = await Promise.all([
    query, supabase.from("learning_spaces").select("id,title").order("title"),
    supabase.from("resource_progress").select("resource_id,percent"), driveInfo(user.id),
  ]);
  const sl = (spaces.data ?? []) as { id: string; title: string }[];
  const pc = (id: string) => ((prog.data ?? []) as { resource_id: string; percent: number | null }[]).find((p) => p.resource_id === id)?.percent;
  const href = (k: string) => `/library?${new URLSearchParams({ ...(k ? { kind: k } : {}), ...(searchParams.space ? { space: searchParams.space } : {}), ...(q ? { q } : {}) })}`;
  return (
    <>
      <div className="page-h">
        <div><h1>Bibliothèque</h1><p>Tous tes documents, vidéos, audios, images et liens — rangés par apprentissage.</p></div>
        <AddResource spaces={sl} drive={drive.status} defaultSpace={searchParams.space} defaultOpen={searchParams.add === "1"} />
      </div>
      <div className="tabs">{TABS.map(([k, l]) => <Link key={k} href={href(k)} className={(searchParams.kind ?? "") === k ? "on" : ""}>{l}</Link>)}</div>
      <form className="row sec0">
        <div className="search" style={{ flex: 1, maxWidth: "none" }}><Search size={15} /><input name="q" defaultValue={searchParams.q ?? ""} placeholder="Rechercher une ressource" /></div>
        {searchParams.kind && <input type="hidden" name="kind" value={searchParams.kind} />}
        <select name="space" defaultValue={searchParams.space ?? ""}><option value="">Tous les apprentissages</option>{sl.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <button className="ghost">Filtrer</button>
      </form>
      <div className="card">
        {(res.data ?? []).length === 0 && <Empty icon={<FolderOpen size={24} />} title="Aucune ressource">Ajoute un fichier ou un lien avec le bouton « Ajouter ».</Empty>}
        {((res.data ?? []) as R[]).map((r) => (
          <Link key={r.id} href={`/library/${r.id}`} className="li">
            <KindTile kind={r.kind} />
            <span className="li-main"><b>{r.name} {r.drive_status === "missing" && <span className="err">⚠ absent de Drive</span>}</b>
              <span className="mu">{KIND_LABEL[r.kind]} {fmtSize(r.size_bytes) && `· ${fmtSize(r.size_bytes)}`} · Ajouté le {fmtDate(r.created_at)}</span></span>
            <SpaceChip space={sl.find((s) => s.id === r.space_id)} plain />
            {pc(r.id) != null && <span className="mu" style={{ width: 44, textAlign: "right" }}>{pc(r.id)}%</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
