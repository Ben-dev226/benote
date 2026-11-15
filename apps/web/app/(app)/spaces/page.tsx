import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSpace, moveSpace } from "./actions";

type S = { id: string; title: string; description: string | null; icon: string | null; category: string | null; progress: number; status: string };

export default async function Spaces({ searchParams }: { searchParams: { archived?: string } }) {
  const { supabase } = await requireUser();
  const arch = searchParams.archived === "1";
  const [sp, notes, res] = await Promise.all([
    supabase.from("learning_spaces").select("id,title,description,icon,category,progress,status").eq("status", arch ? "archived" : "active").order("position").order("created_at", { ascending: false }),
    supabase.from("notes").select("space_id"), supabase.from("resources").select("space_id"),
  ]);
  const count = (rows: { space_id: string | null }[] | null, id: string) => (rows ?? []).filter((r) => r.space_id === id).length;
  const list = (sp.data ?? []) as S[];
  return (
    <>
      <div className="head"><h1>Mes apprentissages</h1>
        <Link className="btn ghost" href={arch ? "/spaces" : "/spaces?archived=1"}>{arch ? "Voir les actifs" : "Voir les archives"}</Link></div>
      <div className="grid">
        {list.map((s) => (
          <div className="card" key={s.id}>
            <Link href={`/spaces/${s.id}`}><b>{s.icon} {s.title}</b></Link>
            <div className="mu">{s.category ?? ""} {s.description}</div>
            <div className="bar"><i style={{ width: `${s.progress}%` }} /></div>
            <div className="row between"><span className="mu">{s.progress}% · {count(res.data, s.id)} ressources · {count(notes.data, s.id)} notes</span>
              {!arch && <span className="row">
                <form action={moveSpace}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button className="ghost" title="Monter">↑</button></form>
                <form action={moveSpace}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button className="ghost" title="Descendre">↓</button></form>
              </span>}
            </div>
          </div>
        ))}
        {!arch && (
          <form action={createSpace} className="card stack dashed">
            <input name="title" placeholder="Titre de l’apprentissage" required maxLength={120} />
            <input name="description" placeholder="Description" maxLength={500} />
            <input name="category" placeholder="Catégorie (ex. Informatique)" maxLength={60} />
            <input name="icon" placeholder="Icône (emoji)" maxLength={8} />
            <button>+ Créer</button>
          </form>
        )}
      </div>
    </>
  );
}
