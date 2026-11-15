import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ConfirmButton from "@/components/ConfirmButton";
import QuickNote from "@/components/QuickNote";
import { fmtSize, fmtTime, KIND_ICON, KIND_LABEL, youtubeId } from "@/lib/util";
import { deleteResource, updateResource } from "../actions";
import PdfViewer from "./PdfViewer";
import MediaPlayer from "./MediaPlayer";
import ImageViewer from "./ImageViewer";
import TextViewer from "./TextViewer";

const one = <X,>(v: X | X[] | null) => (Array.isArray(v) ? v[0] : v);

export default async function Reader({ params, searchParams }: { params: { id: string }; searchParams: { page?: string; t?: string } }) {
  const { supabase } = await requireUser();
  const { data: r } = await supabase.from("resources").select("*").eq("id", params.id).maybeSingle();
  if (!r) notFound();
  const [prog, spaces, links, anns, imgs] = await Promise.all([
    supabase.from("resource_progress").select("last_page,last_seconds,percent").eq("resource_id", r.id).maybeSingle(),
    supabase.from("learning_spaces").select("id,title").order("title"),
    supabase.from("resource_links").select("id,page,timestamp_s,notes(id,title)").eq("resource_id", r.id),
    supabase.from("annotations").select("id,page,data").eq("resource_id", r.id).order("page"),
    r.kind === "image" ? supabase.from("resources").select("id").eq("kind", "image").order("created_at") : Promise.resolve({ data: [] as { id: string }[] }),
  ]);
  const startPage = Number(searchParams.page) || prog.data?.last_page || 1;
  const startTime = Number(searchParams.t) || Number(prog.data?.last_seconds) || 0;
  const yt = r.url ? youtubeId(r.url) : null;
  const imgIds = ((imgs.data ?? []) as { id: string }[]).map((x) => x.id);
  const ix = imgIds.indexOf(r.id);
  const bookmarks = ((anns.data ?? []) as { id: string; page: number; data: { type?: string } | null }[]).filter((a) => a.data?.type === "bookmark").map((a) => ({ id: a.id, page: a.page }));
  const isPdf = r.mime_type === "application/pdf";

  let viewer: React.ReactNode;
  if (r.drive_status === "missing") viewer = <div className="card err">Ce fichier n’existe plus dans ton Google Drive.</div>;
  else if (yt) viewer = (
    <div className="stack">
      <iframe className="media yt" src={`https://www.youtube-nocookie.com/embed/${yt}${startTime ? `?start=${Math.floor(startTime)}` : ""}`} title={r.name} allow="fullscreen; picture-in-picture" allowFullScreen />
      <div className="card"><QuickNote resourceId={r.id} manualTime /></div>
    </div>
  );
  else if (r.url) viewer = <div className="card stack"><span className="mu">{r.url}</span><a className="btn" href={r.url} target="_blank" rel="noopener noreferrer">Ouvrir le lien ↗</a><QuickNote resourceId={r.id} /></div>;
  else if (isPdf) viewer = <PdfViewer id={r.id} initialPage={startPage} bookmarks={bookmarks} />;
  else if (r.kind === "video" || r.kind === "audio") viewer = <MediaPlayer id={r.id} kind={r.kind} title={r.name} initialTime={startTime} />;
  else if (r.kind === "image") viewer = <ImageViewer id={r.id} name={r.name} prev={ix > 0 ? imgIds[ix - 1] : null} next={ix >= 0 && ix < imgIds.length - 1 ? imgIds[ix + 1] : null} />;
  else if (r.mime_type === "text/plain") viewer = <TextViewer id={r.id} />;
  else viewer = <div className="card stack"><span className="mu">Aperçu non disponible pour ce format.</span><a className="btn" href={`/api/resources/${r.id}/file?download=1`}>Télécharger</a></div>;

  return (
    <>
      <div className="head"><h1>{KIND_ICON[r.kind]} {r.name}</h1><Link href="/library" className="btn ghost">← Bibliothèque</Link></div>
      <div className="split wide">
        <div>{viewer}</div>
        <div className="stack">
          <form action={updateResource} className="card stack">
            <input type="hidden" name="id" value={r.id} />
            <input name="name" defaultValue={r.name} />
            <textarea name="description" rows={2} defaultValue={r.description ?? ""} placeholder="Description personnelle" />
            <select name="space_id" defaultValue={r.space_id ?? ""}><option value="">Sans apprentissage</option>
              {(spaces.data ?? []).map((s: { id: string; title: string }) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
            <span className="mu">{KIND_LABEL[r.kind]} {fmtSize(r.size_bytes)} {prog.data?.percent != null ? `· lu à ${prog.data.percent}%` : ""}</span>
            <button>Enregistrer</button>
          </form>
          <div className="card stack"><h2>Notes liées</h2>
            {(links.data ?? []).length === 0 && <span className="mu">Aucune note.</span>}
            {((links.data ?? []) as unknown as { id: string; page: number | null; timestamp_s: number | null; notes: { id: string; title: string } | { id: string; title: string }[] | null }[]).map((l) => {
              const n = one(l.notes); if (!n) return null;
              return <Link key={l.id} href={`/notes/${n.id}`}>📝 {n.title} <span className="mu">{l.page ? `p. ${l.page}` : l.timestamp_s !== null ? fmtTime(l.timestamp_s) : ""}</span></Link>;
            })}
          </div>
          <form action={deleteResource}><input type="hidden" name="id" value={r.id} />
            <ConfirmButton message="Supprimer cette ressource (et le fichier dans ton Drive) ?" className="danger">Supprimer</ConfirmButton></form>
        </div>
      </div>
    </>
  );
}
