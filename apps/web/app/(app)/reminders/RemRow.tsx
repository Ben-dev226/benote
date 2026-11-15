"use client";
import { useRouter } from "next/navigation";
import { deleteReminder, toggleReminder } from "./actions";

export default function RemRow({ id, title, when, done, rec, space }: { id: string; title: string; when: string; done: boolean; rec: string | null; space: string }) {
  const router = useRouter();
  return (
    <div className="row between item">
      <span className="row"><input type="checkbox" checked={done} style={{ width: "auto" }} onChange={async () => { await toggleReminder(id); router.refresh(); }} />
        <span style={{ opacity: done ? 0.5 : 1 }}>{title}<div className="mu">{when} {rec ? "· 🔁" : ""} {space}</div></span></span>
      <button className="ghost" onClick={async () => { await deleteReminder(id); router.refresh(); }}>✕</button>
    </div>
  );
}
