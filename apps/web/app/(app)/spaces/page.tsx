import Link from "next/link";
import { ArrowDown, ArrowUp, GraduationCap, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import Dialog from "@/components/Dialog";
import SubmitButton from "@/components/SubmitButton";
import { Empty } from "@/components/ui";
import { colorFor } from "@/lib/util";
import { createSpace, moveSpace } from "./actions";

type S = { id: string; title: string; description: string | null; icon: string | null; category: string | null; progress: number };

export default async function Spaces({ searchParams }: { searchParams: { archived?: string; new?: string } }) {
  const { supabase } = await requireUser();
  const arch = searchParams.archived === "1";
  const [sp, notes, res] = await Promise.all([
    supabase.from("learning_spaces").select("id,title,description,icon,category,progress").eq("status", arch ? "archived" : "active").order("position").order("created_at", { ascending: false }),
    supabase.from("notes").select("space_id"), supabase.from("resources").select("space_id"),
  ]);
  const count = (rows: { space_id: string | null }[] | null, id: string) => (rows ?? []).filter((r) => r.space_id === id).length;
  const list = (sp.data ?? []) as S[];
  return (
    <>
      <div className="page-h">
        <div><h1>{arch ? "Apprentissages archivés" : "Mes apprentissages"}</h1><p>Chaque apprentissage rassemble ses notes, ses ressources, ses objectifs et ses rappels.</p></div>
        <div className="row">
          <Link className="btn ghost" href={arch ? "/spaces" : "/spaces?archived=1"}>{arch ? "Voir les actifs" : "Archives"}</Link>
          {!arch && (
            <Dialog trigger={<><Plus size={16} /> Nouvel apprentissage</>} title="Nouvel apprentissage" defaultOpen={searchParams.new === "1"}>
              <form action={createSpace} className="stack">
                <input name="title" placeholder="Titre (ex. Réseaux informatiques)" required maxLength={120} autoFocus />
                <input name="description" placeholder="Description" maxLength={500} />
                <div className="row"><input name="category" placeholder="Catégorie" maxLength={60} style={{ flex: 1 }} /><input name="icon" placeholder="Emoji" maxLength={8} style={{ width: 90 }} /></div>
                <SubmitButton>Créer l’apprentissage</SubmitButton>
              </form>
            </Dialog>
          )}
        </div>
      </div>
      {list.length === 0 ? <div className="card"><Empty icon={<GraduationCap size={24} />} title={arch ? "Aucune archive" : "Aucun apprentissage"}>Crée ton premier espace pour y ranger notes et ressources.</Empty></div> : (
        <div className="grid">
          {list.map((s) => (
            <div className="card" key={s.id} style={{ "--c": colorFor(s.id) } as React.CSSProperties}>
              <Link href={`/spaces/${s.id}`} className="stack" style={{ gap: 4 }}>
                <b style={{ fontSize: 17 }}>{s.icon} {s.title}</b>
                <span className="mu">{[s.category, s.description].filter(Boolean).join(" · ")}</span>
                <div className="bar"><i style={{ width: `${s.progress}%` }} /></div>
              </Link>
              <div className="row between"><span className="mu">{s.progress}% · {count(res.data, s.id)} ressources · {count(notes.data, s.id)} notes</span>
                {!arch && <span className="row" style={{ gap: 4 }}>
                  <form action={moveSpace}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button className="btn-icon" aria-label="Monter"><ArrowUp size={14} /></button></form>
                  <form action={moveSpace}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button className="btn-icon" aria-label="Descendre"><ArrowDown size={14} /></button></form>
                </span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
