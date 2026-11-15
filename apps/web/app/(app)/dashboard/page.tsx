import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ACTIVITY_LABEL } from "@/lib/activity";
import { fmtDateTime, KIND_ICON } from "@/lib/util";

type Rel = { id: string; name: string; kind: string } | { id: string; name: string; kind: string }[] | null;

export default async function Dashboard() {
  const { supabase } = await requireUser();
  const [prof, spaces, notes, res, prog, rem, logs] = await Promise.all([
    supabase.from("users").select("display_name").maybeSingle(),
    supabase.from("learning_spaces").select("id,title,icon,progress,description").eq("status", "active").order("position").order("created_at", { ascending: false }),
    supabase.from("notes").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("resources").select("id,name,kind").order("created_at", { ascending: false }).limit(5),
    supabase.from("resource_progress").select("percent,updated_at,resources(id,name,kind)").or("percent.is.null,percent.lt.100").order("updated_at", { ascending: false }).limit(3),
    supabase.from("reminders").select("id,title,remind_at").eq("done", false).order("remind_at").limit(4),
    supabase.from("activity_logs").select("id,action,meta,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const sp = (spaces.data ?? []) as { id: string; title: string; icon: string | null; progress: number }[];
  const global = sp.length ? Math.round(sp.reduce((a, s) => a + s.progress, 0) / sp.length) : 0;
  const resume = ((prog.data ?? []) as { percent: number | null; resources: Rel }[])
    .map((p) => ({ p: p.percent, r: Array.isArray(p.resources) ? p.resources[0] : p.resources })).filter((x) => x.r);

  return (
    <>
      <div className="hero">
        <h1>Bonjour {prof.data?.display_name ?? ""} 👋</h1>
        <p>Prêt à apprendre quelque chose de nouveau aujourd’hui ?</p>
        <div className="row">
          <Link className="btn" href="/spaces">+ Nouvel apprentissage</Link>
          <Link className="btn ghost" href="/notes">📝 Mes notes</Link>
          <Link className="btn ghost" href="/library">📁 Ajouter une ressource</Link>
          <Link className="btn ghost" href="/reminders">🔔 Créer un rappel</Link>
        </div>
      </div>

      <div className="grid">
        <div className="card"><h2>Progression globale</h2><div className="big">{global}%</div><div className="bar"><i style={{ width: `${global}%` }} /></div></div>
        <div className="card">
          <h2>Reprendre</h2>
          {resume.length === 0 && <span className="mu">Rien en cours.</span>}
          {resume.map(({ p, r }) => { const x = r as { id: string; name: string; kind: string }; return (
            <Link key={x.id} href={`/library/${x.id}`} className="item">{KIND_ICON[x.kind]} {x.name} <span className="mu">{p ?? 0}%</span></Link>
          ); })}
        </div>
        <div className="card">
          <h2>Rappels</h2>
          {(rem.data ?? []).length === 0 && <span className="mu">Aucun rappel à venir.</span>}
          {(rem.data ?? []).map((r: { id: string; title: string; remind_at: string }) => (
            <div key={r.id} className="item">{r.title}<div className="mu">{fmtDateTime(r.remind_at)}</div></div>
          ))}
        </div>
      </div>

      <h2 className="sec">Mes apprentissages</h2>
      <div className="grid">
        {sp.map((s) => (
          <Link key={s.id} href={`/spaces/${s.id}`} className="card">
            <b>{s.icon} {s.title}</b>
            <div className="bar"><i style={{ width: `${s.progress}%` }} /></div><span className="mu">{s.progress}%</span>
          </Link>
        ))}
        {sp.length === 0 && <div className="card mu">Crée ton premier apprentissage depuis « Apprentissages ».</div>}
      </div>

      <div className="grid sec">
        <div className="card"><h2>Notes récentes</h2>
          {(notes.data ?? []).map((n: { id: string; title: string }) => <Link key={n.id} href={`/notes/${n.id}`} className="item">📝 {n.title || "Sans titre"}</Link>)}
        </div>
        <div className="card"><h2>Ressources récentes</h2>
          {(res.data ?? []).map((r: { id: string; name: string; kind: string }) => <Link key={r.id} href={`/library/${r.id}`} className="item">{KIND_ICON[r.kind]} {r.name}</Link>)}
        </div>
        <div className="card"><h2>Activité récente</h2>
          {(logs.data ?? []).length === 0 && <span className="mu">Aucune activité.</span>}
          {(logs.data ?? []).map((a: { id: string; action: string; meta: { title?: string } | null; created_at: string }) => (
            <div key={a.id} className="mu item">{ACTIVITY_LABEL[a.action] ?? a.action} : {a.meta?.title ?? ""}</div>
          ))}
        </div>
      </div>
    </>
  );
}
