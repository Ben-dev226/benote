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
        <div><h1>{arch ? "Apprentissages archivés" : "Apprentissages"}</h1><p>Un espace par sujet : tout ce qui s’y rapporte reste au même endroit.</p></div>
        <div className="row">
          <Link className="btn ghost" href={arch ? "/spaces" : "/spaces?archived=1"}>{arch ? "Voir les actifs" : "Archives"}</Link>
          {!arch && (
            <Dialog trigger={<><Plus size={16} /> Nouveau</>} title="Nouvel apprentissage" defaultOpen={searchParams.new === "1"}>
              <form action={createSpace} className="stack">
                <input name="title" placeholder="Titre (ex. Réseaux informatiques)" required maxLength={120} autoFocus />
                <input name="description" placeholder="Description" maxLength={500} />
                <div className="row"><input name="category" placeholder="Catégorie" maxLength={60} style={{ flex: 1 }} /><input name="icon" placeholder="Emoji" maxLength={8} style={{ width: 90 }} /></div>
                <SubmitButton>Créer</SubmitButton>
              </form>
            </Dialog>
          )}
        </div>
      </div>
      {list.length === 0 ? <Empty icon={<GraduationCap size={20} />} title={arch ? "Aucune archive" : "Aucun apprentissage"}>Un apprentissage rassemble les notes, ressources, objectifs et rappels d’un même sujet.</Empty> : (
        <div>
          {list.map((s) => (
            <div className="sp-row" key={s.id} style={{ "--c": colorFor(s.id) } as React.CSSProperties}>
              <span className="tab" />
              <Link href={`/spaces/${s.id}`} style={{ flex: 1, minWidth: 0 }}>
                <h2>{s.icon} {s.title}</h2>
                <span className="mu">{[s.category, s.description].filter(Boolean).join(" — ") || "Pas de description"}</span>
                <div className="bar" style={{ maxWidth: 360 }}><i style={{ width: `${s.progress}%` }} /></div>
              </Link>
              <span className="mu" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{s.progress} %<br />{count(notes.data, s.id)} notes · {count(res.data, s.id)} ressources</span>
              {!arch && <span className="row" style={{ gap: 0, flexWrap: "nowrap" }}>
                <form action={moveSpace}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button className="btn-icon sm" aria-label="Monter"><ArrowUp size={14} /></button></form>
                <form action={moveSpace}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button className="btn-icon sm" aria-label="Descendre"><ArrowDown size={14} /></button></form>
              </span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
