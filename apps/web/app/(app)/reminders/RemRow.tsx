"use client";
import { useRouter } from "next/navigation";
import { Check, Repeat, Trash2 } from "lucide-react";
import { deleteReminder, toggleReminder } from "./actions";

export default function RemRow({ id, title, when, done, rec, space, color, compact }: { id: string; title: string; when: string; done: boolean; rec: string | null; space: string; color: string; compact?: boolean }) {
  const router = useRouter();
  return (
    <div className="li">
      <button className="btn-icon" aria-label="Terminé" style={{ borderRadius: "50%", background: done ? "var(--ok)" : "transparent", color: done ? "#fff" : "var(--mu)", border: "1.5px solid var(--line2)", width: 26, height: 26 }}
        onClick={async () => { await toggleReminder(id); router.refresh(); }}><Check size={14} /></button>
      <span className="li-main" style={{ opacity: done ? 0.5 : 1 }}><span className="t" style={{ textDecoration: done ? "line-through" : "none" }}>{title}</span><span className="mu">{when} {rec && <Repeat size={11} style={{ verticalAlign: "middle" }} />}</span></span>
      {space && <span className="chip" style={{ "--c": color } as React.CSSProperties}><i />{space}</span>}
      {!compact && <button className="btn-icon" aria-label="Supprimer" onClick={async () => { await deleteReminder(id); router.refresh(); }}><Trash2 size={14} /></button>}
    </div>
  );
}
