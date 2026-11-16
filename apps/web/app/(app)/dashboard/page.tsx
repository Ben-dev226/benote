import Link from "next/link";
import { ArrowRight, Bell, FileText, FolderOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ACTIVITY_LABEL } from "@/lib/activity";
import { ago, colorFor, dayBucket, fmtDateTime, longDate } from "@/lib/util";
import { Empty, KindTile, SpaceChip } from "@/components/ui";
import RemRow from "../reminders/RemRow";

type Rel = { id: string; name: string; kind: string; space_id: string | null } | { id: string; name: string; kind: string; space_id: string | null }[] | null;
type Sp = { id: string; title: string; icon: string | null; progress: number };

export default async function Dashboard() {
  const { supabase } = await requireUser();
  const [prof, spaces, nSp, rSp, res, prog, rem, logs, notes] = await Promise.all([
    supabase.from("users").select("display_name").maybeSingle(),
    supabase.from("learning_spaces").select("id,title,icon,progress").eq("status", "active").order("position").order("created_at", { ascending: false }),
    supabase.from("notes").select("space_id"), supabase.from("resources").select("space_id"),
    supabase.from("resources").select("id,name,kind,created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("resource_progress").select("percent,last_page,resources(id,name,kind,space_id)").or("percent.is.null,percent.lt.100").order("updated_at", { ascending: false }).limit(1),
    supabase.from("reminders").select("id,title,remind_at,done,recurrence,space_id").eq("done", false).order("remind_at").limit(8),
    supabase.from("activity_logs").select("id,action,meta,created_at,space_id").order("created_at", { ascending: false }).limit(5),
    supabase.from("notes").select("id,title,content,updated_at,space_id").order("updated_at", { ascending: false }).limit(5),
  ]);
  const sp = (spaces.data ?? []) as Sp[];
  const cnt = (rows: { space_id: string | null }[] | null, id: string) => (rows ?? []).filter((r) => r.space_id === id).length;
  const rems = ((rem.data ?? []) as { id: string; title: string; remind_at: string; done: boolean; recurrence: string | null; space_id: string | null }[]).filter((r) => ["En retard", "Aujourd’hui"].includes(dayBucket(r.remind_at)));
  const p0 = ((prog.data ?? []) as unknown as { percent: number | null; last_page: number | null; resources: Rel }[])[0];
  const rr = p0 ? (Array.isArray(p0.resources) ? p0.resources[0] : p0.resources) : null;
  const lastNote = ((notes.data ?? []) as { id: string; title: string; content: string; updated_at: string; space_id: string | null }[])[0];
  const name = prof.data?.display_name ?? "";
  const sname = (id: string | null) => sp.find((s) => s.id === id) ?? null;

  return (
    <>
      <header style={{ marginBottom: 34 }}>
        <h1 className="day">{longDate()}</h1>
        <p className="mu" style={{ fontSize: 16, margin: "8px 0 0" }}>Bonjour {name}. {rems.length ? `${rems.length} rappel${rems.length > 1 ? "s" : ""} pour aujourd’hui.` : "Rien d’urgent aujourd’hui."}</p>
      </header>
      <div className="cols">
        <div className="stack-lg">
          {(rr || lastNote) && (
            <section>
              <h2 className="sec-t" style={{ marginBottom: 10 }}>Reprendre</h2>
              {rr ? (
                <Link href={`/library/${rr.id}`} className="resume"><KindTile kind={rr.kind} />
                  <span style={{ flex: 1, minWidth: 0 }}><b>{rr.name}</b><span className="mu">{p0?.percent != null ? `Lu à ${p0.percent} %` : "En cours"}{p0?.last_page ? ` · page ${p0.last_page}` : ""}</span></span>
                  <span className="btn">Continuer <ArrowRight size={15} /></span></Link>
              ) : lastNote && (
                <Link href={`/notes/${lastNote.id}`} className="resume"><span className="tile" style={{ background: "var(--side)" }}><FileText size={18} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}><b>{lastNote.title || "Sans titre"}</b><span className="mu">Modifiée {ago(lastNote.updated_at).toLowerCase()}</span></span>
                  <span className="btn">Ouvrir <ArrowRight size={15} /></span></Link>
              )}
            </section>
          )}
          <section>
            <div className="sec-h2"><h2 className="sec-t">Aujourd’hui</h2><Link href="/reminders">Tous les rappels</Link></div>
            {rems.length === 0 ? <Empty icon={<Bell size={18} />} title="Aucun rappel pour aujourd’hui"><Link href="/reminders?new=1" style={{ color: "var(--accent)", fontWeight: 600 }}>Planifier une séance d’étude</Link></Empty> :
              rems.map((r) => <RemRow key={r.id} id={r.id} title={r.title} when={fmtDateTime(r.remind_at)} done={r.done} rec={r.recurrence} space={sname(r.space_id)?.title ?? ""} color={colorFor(r.space_id)} compact />)}
          </section>
          <section>
            <div className="sec-h2"><h2 className="sec-t">Notes récentes</h2><Link href="/notes">Toutes les notes</Link></div>
            {((notes.data ?? []) as { id: string; title: string; content: string; updated_at: string; space_id: string | null }[]).length === 0 && <Empty icon={<FileText size={18} />} title="Aucune note pour l’instant">Utilise « Nouvelle note » dans le menu.</Empty>}
            {((notes.data ?? []) as { id: string; title: string; content: string; updated_at: string; space_id: string | null }[]).map((n) => (
              <Link key={n.id} href={`/notes/${n.id}`} className="li"><span className="li-main"><b>{n.title || "Sans titre"}</b><span className="mu clamp">{n.content.slice(0, 90) || "Note vide"}</span></span>
                <SpaceChip space={sname(n.space_id)} plain /><span className="mu">{ago(n.updated_at)}</span></Link>
            ))}
          </section>
        </div>
        <aside className="stack-lg">
          <section>
            <div className="sec-h2"><h2 className="sec-t">Apprentissages</h2><Link href="/spaces">Gérer</Link></div>
            {sp.length === 0 && <Empty icon={<FolderOpen size={18} />} title="Aucun apprentissage"><Link href="/spaces?new=1" style={{ color: "var(--accent)", fontWeight: 600 }}>Créer le premier</Link></Empty>}
            {sp.map((s) => (
              <Link key={s.id} href={`/spaces/${s.id}`} className="sp-row" style={{ "--c": colorFor(s.id), padding: "12px 0" } as React.CSSProperties}>
                <span className="tab" style={{ width: 5, minHeight: 36 }} />
                <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: "block" }}>{s.icon} {s.title}</b>
                  <span className="mu">{cnt(nSp.data, s.id)} notes · {cnt(rSp.data, s.id)} ressources</span><div className="bar"><i style={{ width: `${s.progress}%` }} /></div></span>
                <span className="mu">{s.progress} %</span>
              </Link>
            ))}
          </section>
          <section>
            <div className="sec-h2"><h2 className="sec-t">Ressources récentes</h2><Link href="/library">Bibliothèque</Link></div>
            {(res.data ?? []).length === 0 && <span className="mu">Aucune ressource.</span>}
            {(res.data ?? []).map((r: { id: string; name: string; kind: string; created_at: string }) => (
              <Link key={r.id} href={`/library/${r.id}`} className="li"><KindTile kind={r.kind} /><span className="li-main"><b>{r.name}</b><span className="mu">{ago(r.created_at)}</span></span></Link>
            ))}
          </section>
          <section>
            <h2 className="sec-t" style={{ marginBottom: 10 }}>Activité</h2>
            <div className="timeline">{(logs.data ?? []).map((a: { id: string; action: string; meta: { title?: string } | null; created_at: string; space_id: string | null }) => (
              <div key={a.id} className="tl"><i style={{ background: colorFor(a.space_id) }} /><div><span style={{ fontWeight: 600 }}>{ACTIVITY_LABEL[a.action] ?? a.action} : {a.meta?.title ?? ""}</span><div className="mu">{ago(a.created_at)}</div></div></div>
            ))}</div>
          </section>
        </aside>
      </div>
    </>
  );
}
