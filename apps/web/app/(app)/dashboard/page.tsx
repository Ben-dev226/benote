import Link from "next/link";
import { Bell, Bot, Cloud, FileText, FolderPlus, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ACTIVITY_LABEL } from "@/lib/activity";
import { ago, colorFor, fmtDateTime } from "@/lib/util";
import { Empty, KindTile, ProgressRing, SpaceChip } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { createNote } from "../notes/actions";

type Rel = { id: string; name: string; kind: string } | { id: string; name: string; kind: string }[] | null;
type Sp = { id: string; title: string; icon: string | null; progress: number; description: string | null };

export default async function Dashboard() {
  const { supabase } = await requireUser();
  const [prof, spaces, nSp, rSp, res, prog, rem, logs] = await Promise.all([
    supabase.from("users").select("display_name").maybeSingle(),
    supabase.from("learning_spaces").select("id,title,icon,progress,description").eq("status", "active").order("position").order("created_at", { ascending: false }),
    supabase.from("notes").select("space_id"), supabase.from("resources").select("space_id"),
    supabase.from("resources").select("id,name,kind,created_at,space_id").order("created_at", { ascending: false }).limit(5),
    supabase.from("resource_progress").select("percent,resources(id,name,kind)").or("percent.is.null,percent.lt.100").order("updated_at", { ascending: false }).limit(3),
    supabase.from("reminders").select("id,title,remind_at,space_id").eq("done", false).order("remind_at").limit(4),
    supabase.from("activity_logs").select("id,action,meta,created_at,space_id").order("created_at", { ascending: false }).limit(6),
  ]);
  const sp = (spaces.data ?? []) as Sp[];
  const find = (id: string | null) => sp.find((s) => s.id === id) ?? null;
  const cnt = (rows: { space_id: string | null }[] | null, id: string) => (rows ?? []).filter((r) => r.space_id === id).length;
  const global = sp.length ? Math.round(sp.reduce((a, s) => a + s.progress, 0) / sp.length) : 0;
  const resume = ((prog.data ?? []) as unknown as { percent: number | null; resources: Rel }[]).map((p) => ({ p: p.percent ?? 0, r: Array.isArray(p.resources) ? p.resources[0] : p.resources })).filter((x) => x.r) as { p: number; r: { id: string; name: string; kind: string } }[];

  return (
    <>
      <div className="hero">
        <svg width="320" height="190" viewBox="0 0 320 190" fill="none"><circle cx="230" cy="120" r="90" fill="#ffffff22" /><circle cx="150" cy="170" r="60" fill="#ffffff18" /><rect x="200" y="30" width="70" height="90" rx="12" fill="#ffffff22" /></svg>
        <h1>Bonjour {prof.data?.display_name ?? ""} 👋</h1>
        <p>Prêt à apprendre quelque chose de nouveau aujourd’hui ?</p>
        <div className="row">
          <Link className="btn" style={{ background: "#fff", color: "#3b2a8f" }} href="/spaces?new=1"><Plus size={16} /> Nouvel apprentissage</Link>
          {resume[0] && <Link className="btn ghost" href={`/library/${resume[0].r.id}`}>Reprendre : {resume[0].r.name.slice(0, 28)}</Link>}
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <div className="card-h"><h2>Ma progression</h2><Link href="/spaces">Voir tout</Link></div>
          <div className="row" style={{ gap: 18, flexWrap: "nowrap" }}>
            <ProgressRing value={global} />
            <div className="stack" style={{ gap: 6, minWidth: 0, flex: 1 }}>
              {sp.slice(0, 4).map((s) => <div key={s.id} className="row between" style={{ flexWrap: "nowrap" }}><SpaceChip space={s} plain /><span className="mu">{s.progress}%</span></div>)}
              {sp.length === 0 && <span className="mu">Crée un apprentissage pour suivre ta progression.</span>}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h2>Rappels</h2><Link href="/reminders">Voir tout</Link></div>
          {(rem.data ?? []).length === 0 ? <Empty icon={<Bell size={22} />} title="Rien à venir"><Link href="/reminders?new=1" style={{ color: "var(--ac)" }}>Créer un rappel</Link></Empty> :
            (rem.data ?? []).map((r: { id: string; title: string; remind_at: string; space_id: string | null }) => (
              <div key={r.id} className="li"><span className="tile" style={{ background: `${colorFor(r.space_id)}26`, color: colorFor(r.space_id), width: 34, height: 34 }}><Bell size={16} /></span>
                <span className="li-main"><b>{r.title}</b><span className="mu">{fmtDateTime(r.remind_at)}</span></span></div>
            ))}
        </div>
        <div className="card">
          <div className="card-h"><h2>Actions rapides</h2></div>
          <div className="actions">
            <form action={createNote}><SubmitButton className="btn act"><FileText size={22} />Ajouter une note</SubmitButton></form>
            <Link href="/library?add=1" className="btn act"><FolderPlus size={22} />Ajouter une ressource</Link>
            <Link href="/reminders?new=1" className="btn act"><Bell size={22} />Créer un rappel</Link>
            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="btn act"><Cloud size={22} />Ouvrir Google Drive</a>
          </div>
        </div>
      </div>

      <div className="sec-h"><h2>Mes apprentissages</h2><Link href="/spaces" className="mu">Voir tout →</Link></div>
      <div className="grid">
        {sp.map((s) => (
          <Link key={s.id} href={`/spaces/${s.id}`} className="card" style={{ "--c": colorFor(s.id) } as React.CSSProperties}>
            <div className="row between"><b style={{ fontSize: 16 }}>{s.icon} {s.title}</b><span className="mu">{s.progress}%</span></div>
            <div className="bar"><i style={{ width: `${s.progress}%` }} /></div>
            <div className="mu">{cnt(rSp.data, s.id)} ressources · {cnt(nSp.data, s.id)} notes</div>
          </Link>
        ))}
        <Link href="/spaces?new=1" className="card dashed" style={{ display: "grid", placeItems: "center", minHeight: 110, color: "var(--ac)" }}><span className="row"><Plus size={18} /> Créer un apprentissage</span></Link>
      </div>

      <div className="g3 sec">
        <div className="card">
          <div className="card-h"><h2>Ressources récentes</h2><Link href="/library">Voir tout</Link></div>
          {(res.data ?? []).length === 0 && <Empty icon={<FolderPlus size={22} />} title="Aucune ressource" />}
          {(res.data ?? []).map((r: { id: string; name: string; kind: string; created_at: string; space_id: string | null }) => (
            <Link key={r.id} href={`/library/${r.id}`} className="li"><KindTile kind={r.kind} /><span className="li-main"><b>{r.name}</b><span className="mu">{ago(r.created_at)}</span></span></Link>
          ))}
        </div>
        <div className="card">
          <div className="card-h"><h2>Activité récente</h2></div>
          {(logs.data ?? []).length === 0 && <span className="mu">Aucune activité.</span>}
          <div className="timeline">
            {(logs.data ?? []).map((a: { id: string; action: string; meta: { title?: string } | null; created_at: string; space_id: string | null }) => (
              <div key={a.id} className="tl"><i style={{ background: colorFor(a.space_id) }} /><div><b style={{ fontSize: 14 }}>{ACTIVITY_LABEL[a.action] ?? a.action} : {a.meta?.title ?? ""}</b><div className="mu">{ago(a.created_at)} {find(a.space_id) ? `· ${find(a.space_id)!.title}` : ""}</div></div></div>
            ))}
          </div>
        </div>
        <div className="card stack">
          <div className="card-h"><h2>Ton compagnon IA <span className="tag">facultatif</span></h2></div>
          <div className="row" style={{ flexWrap: "nowrap" }}><span className="bot"><Bot size={30} /></span><span className="mu">Pose-moi une question ou demande-moi d’expliquer une notion.</span></div>
          <div className="row">
            <Link className="tag" href="/assistant?agent=professeur&q=Explique-moi une notion">Expliquer une notion</Link>
            <Link className="tag" href="/assistant?agent=revision&q=Fais-moi une fiche de révision">Fiche de révision</Link>
            <Link className="tag" href="/assistant?agent=synthese&q=Résume ma dernière note">Résumer une note</Link>
          </div>
        </div>
      </div>
    </>
  );
}
