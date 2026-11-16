import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Bell, Check, FileText, FolderPlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { requireUser } from "@/lib/auth";
import ConfirmButton from "@/components/ConfirmButton";
import Dialog from "@/components/Dialog";
import SubmitButton from "@/components/SubmitButton";
import { Empty, KindTile } from "@/components/ui";
import ReminderForm from "../../reminders/ReminderForm";
import { createNote } from "../../notes/actions";
import { addGoal, deleteGoal, deleteSpace, setSpaceStatus, toggleGoal, updateSpace } from "../actions";
import { ago, colorFor, fmtDate, fmtDateTime } from "@/lib/util";
import { ACTIVITY_LABEL } from "@/lib/activity";

export default async function SpaceHub({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser();
  const { data: s } = await supabase.from("learning_spaces").select("*").eq("id", params.id).maybeSingle();
  if (!s) notFound();
  const [goals, notes, res, rem, logs] = await Promise.all([
    supabase.from("learning_goals").select("id,title,done,target_date").eq("space_id", s.id).order("created_at"),
    supabase.from("notes").select("id,title,updated_at").eq("space_id", s.id).order("updated_at", { ascending: false }),
    supabase.from("resources").select("id,name,kind,created_at").eq("space_id", s.id).order("created_at", { ascending: false }),
    supabase.from("reminders").select("id,title,remind_at").eq("space_id", s.id).eq("done", false).order("remind_at").limit(5),
    supabase.from("activity_logs").select("id,action,meta,created_at").eq("space_id", s.id).order("created_at", { ascending: false }).limit(6),
  ]);
  const gl = (goals.data ?? []) as { id: string; title: string; done: boolean; target_date: string | null }[];
  const color = colorFor(s.id);
  return (
    <div style={{ "--c": color } as React.CSSProperties}>
      <div className="strip" />
      <div className="crumbs"><Link href="/spaces">Apprentissages</Link> / <span>{s.title}</span></div>
      <div className="page-h">
        <div><h1>{s.icon} {s.title}</h1>
          <p>{[s.category, s.description].filter(Boolean).join(" — ")}</p>
          <div style={{ maxWidth: 320 }}><div className="bar"><i style={{ width: `${s.progress}%` }} /></div><span className="mu">{s.progress} % {gl.length > 0 ? `· ${gl.filter((g) => g.done).length} objectif(s) sur ${gl.length}` : ""}</span></div></div>
        <div className="row">
          <form action={createNote}><input type="hidden" name="space_id" value={s.id} /><SubmitButton><FileText size={16} /> Note</SubmitButton></form>
          <Link className="btn ghost" href={`/library?add=1&space=${s.id}`}><FolderPlus size={16} /> Ressource</Link>
          <Dialog className="btn ghost" trigger={<><Bell size={16} /> Rappel</>} title="Nouveau rappel"><ReminderForm spaces={[{ id: s.id, title: s.title }]} fixedSpace={s.id} /></Dialog>
          <Dialog className="btn-icon" trigger={<Pencil size={16} />} title="Modifier l’apprentissage">
            <form action={updateSpace} className="stack">
              <input type="hidden" name="id" value={s.id} />
              <input name="title" defaultValue={s.title} required />
              <input name="description" defaultValue={s.description ?? ""} placeholder="Description" />
              <div className="row"><input name="category" defaultValue={s.category ?? ""} placeholder="Catégorie" style={{ flex: 1 }} /><input name="icon" defaultValue={s.icon ?? ""} placeholder="Emoji" style={{ width: 90 }} /></div>
              {gl.length === 0 ? <label className="mu">Progression : <input type="number" name="progress" min={0} max={100} defaultValue={s.progress} style={{ width: 80 }} /> %</label>
                : <span className="mu">La progression est calculée à partir des objectifs cochés.</span>}
              <SubmitButton>Enregistrer</SubmitButton>
            </form>
          </Dialog>
        </div>
      </div>

      <div className="cols">
        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-h"><h2 className="sec-t">Notes ({(notes.data ?? []).length})</h2></div>
            {(notes.data ?? []).length === 0 && <Empty icon={<FileText size={22} />} title="Aucune note" >Utilise le bouton « Note » ci-dessus.</Empty>}
            {(notes.data ?? []).map((n: { id: string; title: string; updated_at: string }) => (
              <Link key={n.id} href={`/notes/${n.id}`} className="li"><span className="tile" style={{ background: `${color}26`, color }}><FileText size={18} /></span><span className="li-main"><b>{n.title || "Sans titre"}</b><span className="mu">{ago(n.updated_at)}</span></span></Link>
            ))}
          </div>
          <div className="card">
            <div className="card-h"><h2 className="sec-t">Ressources ({(res.data ?? []).length})</h2></div>
            {(res.data ?? []).length === 0 && <Empty icon={<FolderPlus size={22} />} title="Aucune ressource">Ajoute un PDF, une vidéo ou un lien avec le bouton « Ressource ».</Empty>}
            {(res.data ?? []).map((r: { id: string; name: string; kind: string; created_at: string }) => (
              <Link key={r.id} href={`/library/${r.id}`} className="li"><KindTile kind={r.kind} /><span className="li-main"><b>{r.name}</b><span className="mu">Ajouté le {fmtDate(r.created_at)}</span></span></Link>
            ))}
          </div>
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <div className="card stack">
            <div className="card-h" style={{ marginBottom: 0 }}><h2>Objectifs</h2><span className="mu">{gl.filter((g) => g.done).length}/{gl.length}</span></div>
            {gl.map((g) => (
              <div key={g.id} className="row between" style={{ flexWrap: "nowrap" }}>
                <form action={toggleGoal} className="row" style={{ flexWrap: "nowrap", flex: 1 }}>
                  <input type="hidden" name="id" value={g.id} /><input type="hidden" name="space_id" value={s.id} /><input type="hidden" name="done" value={String(g.done)} />
                  <button className="btn-icon" aria-label="Basculer" style={{ background: g.done ? "var(--ok)" : undefined, color: g.done ? "#052e1b" : undefined }}><Check size={14} /></button>
                  <span style={{ textDecoration: g.done ? "line-through" : "none", opacity: g.done ? 0.6 : 1 }}>{g.title} {g.target_date && <span className="mu">({g.target_date})</span>}</span>
                </form>
                <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="space_id" value={s.id} /><button className="btn-icon" aria-label="Supprimer"><X size={14} /></button></form>
              </div>
            ))}
            <form action={addGoal} className="row" style={{ flexWrap: "nowrap" }}>
              <input type="hidden" name="space_id" value={s.id} />
              <input name="title" placeholder="Nouvel objectif" style={{ flex: 1 }} /><SubmitButton className="btn btn-sm"><Plus size={15} /></SubmitButton>
            </form>
          </div>
          <div className="card">
            <div className="card-h"><h2>Rappels</h2></div>
            {(rem.data ?? []).length === 0 && <span className="mu">Aucun rappel pour cet apprentissage.</span>}
            {(rem.data ?? []).map((r: { id: string; title: string; remind_at: string }) => <div key={r.id} className="li"><Bell size={16} color={color} /><span className="li-main"><b>{r.title}</b><span className="mu">{fmtDateTime(r.remind_at)}</span></span></div>)}
          </div>
          <div className="card">
            <div className="card-h"><h2>Activité</h2></div>
            <div className="timeline">{(logs.data ?? []).map((a: { id: string; action: string; meta: { title?: string } | null; created_at: string }) => (
              <div key={a.id} className="tl"><i style={{ background: color }} /><div><b style={{ fontSize: 14 }}>{ACTIVITY_LABEL[a.action] ?? a.action} : {a.meta?.title}</b><div className="mu">{ago(a.created_at)}</div></div></div>
            ))}</div>
          </div>
          <div className="row">
            <form action={setSpaceStatus}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value={s.status === "active" ? "archived" : "active"} />
              <button className="ghost"><Archive size={15} />{s.status === "active" ? "Archiver" : "Restaurer"}</button></form>
            <form action={deleteSpace}><input type="hidden" name="id" value={s.id} />
              <ConfirmButton message="Supprimer cet apprentissage ? Les notes et ressources seront conservées mais détachées." className="danger"><Trash2 size={15} />Supprimer</ConfirmButton></form>
          </div>
        </div>
      </div>
    </div>
  );
}
