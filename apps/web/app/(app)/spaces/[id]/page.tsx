import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ConfirmButton from "@/components/ConfirmButton";
import { createNote } from "../../notes/actions";
import { addGoal, deleteGoal, deleteSpace, setSpaceStatus, toggleGoal, updateSpace } from "../actions";
import { fmtDate, KIND_ICON } from "@/lib/util";

export default async function SpaceDetail({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser();
  const { data: s } = await supabase.from("learning_spaces").select("*").eq("id", params.id).maybeSingle();
  if (!s) notFound();
  const [goals, notes, res, logs] = await Promise.all([
    supabase.from("learning_goals").select("id,title,done,target_date").eq("space_id", s.id).order("created_at"),
    supabase.from("notes").select("id,title,updated_at").eq("space_id", s.id).order("updated_at", { ascending: false }),
    supabase.from("resources").select("id,name,kind").eq("space_id", s.id).order("created_at", { ascending: false }),
    supabase.from("activity_logs").select("id,action,meta,created_at").eq("space_id", s.id).order("created_at", { ascending: false }).limit(6),
  ]);
  return (
    <>
      <div className="head"><h1>{s.icon} {s.title}</h1><Link href="/spaces" className="btn ghost">← Retour</Link></div>
      <div className="grid">
        <form action={updateSpace} className="card stack">
          <input type="hidden" name="id" value={s.id} />
          <input name="title" defaultValue={s.title} required />
          <input name="description" defaultValue={s.description ?? ""} placeholder="Description" />
          <input name="category" defaultValue={s.category ?? ""} placeholder="Catégorie" />
          <input name="icon" defaultValue={s.icon ?? ""} placeholder="Icône" />
          <label className="mu">Progression : <input type="number" name="progress" min={0} max={100} defaultValue={s.progress} style={{ width: 80 }} /> %</label>
          <button>Enregistrer</button>
        </form>
        <div className="card stack">
          <h2>Objectifs</h2>
          {(goals.data ?? []).map((g: { id: string; title: string; done: boolean; target_date: string | null }) => (
            <div key={g.id} className="row between">
              <form action={toggleGoal} className="row">
                <input type="hidden" name="id" value={g.id} /><input type="hidden" name="space_id" value={s.id} /><input type="hidden" name="done" value={String(g.done)} />
                <button className="ghost">{g.done ? "✅" : "⬜"}</button>
                <span style={{ textDecoration: g.done ? "line-through" : "none" }}>{g.title} {g.target_date && <span className="mu">({g.target_date})</span>}</span>
              </form>
              <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="space_id" value={s.id} /><button className="ghost">✕</button></form>
            </div>
          ))}
          <form action={addGoal} className="row">
            <input type="hidden" name="space_id" value={s.id} />
            <input name="title" placeholder="Nouvel objectif" style={{ flex: 1 }} /><input type="date" name="target_date" style={{ width: 150 }} /><button>+</button>
          </form>
        </div>
      </div>

      <div className="grid sec">
        <div className="card"><div className="row between"><h2>Notes</h2>
          <form action={createNote}><input type="hidden" name="space_id" value={s.id} /><button>+ Note</button></form></div>
          {(notes.data ?? []).map((n: { id: string; title: string; updated_at: string }) => <Link key={n.id} href={`/notes/${n.id}`} className="item">📝 {n.title || "Sans titre"} <span className="mu">{fmtDate(n.updated_at)}</span></Link>)}
        </div>
        <div className="card"><div className="row between"><h2>Ressources</h2><Link className="btn" href="/library">+ Ajouter</Link></div>
          {(res.data ?? []).map((r: { id: string; name: string; kind: string }) => <Link key={r.id} href={`/library/${r.id}`} className="item">{KIND_ICON[r.kind]} {r.name}</Link>)}
        </div>
        <div className="card"><h2>Historique</h2>
          {(logs.data ?? []).map((a: { id: string; action: string; meta: { title?: string } | null }) => <div key={a.id} className="mu item">{a.action} : {a.meta?.title}</div>)}
        </div>
      </div>

      <div className="row sec">
        <form action={setSpaceStatus}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value={s.status === "active" ? "archived" : "active"} />
          <button className="ghost">{s.status === "active" ? "Archiver" : "Restaurer"}</button></form>
        <form action={deleteSpace}><input type="hidden" name="id" value={s.id} />
          <ConfirmButton message="Supprimer cet apprentissage ? Les notes et ressources seront conservées mais détachées." className="danger">Supprimer</ConfirmButton></form>
      </div>
    </>
  );
}
