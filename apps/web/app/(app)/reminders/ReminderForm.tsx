"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/Dialog";
import { createReminder } from "./actions";

export default function ReminderForm({ spaces, fixedSpace }: { spaces: { id: string; title: string }[]; fixedSpace?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const dlg = useDialog();
  return (
    <form className="stack" data-keep-open onSubmit={(e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const local = String(fd.get("local") ?? "");
      if (!local) return;
      fd.set("remind_at", new Date(local).toISOString()); // heure locale du navigateur -> UTC
      start(async () => { await createReminder(fd); form.reset(); router.refresh(); dlg?.close(); });
    }}>
      <input name="title" placeholder="Ex. Réviser le modèle OSI" required autoFocus />
      <input name="local" type="datetime-local" required />
      <select name="recurrence"><option value="">Ponctuel</option><option value="daily">Chaque jour</option><option value="weekly">Chaque semaine</option><option value="monthly">Chaque mois</option></select>
      <select name="space_id" defaultValue={fixedSpace ?? ""}><option value="">Sans apprentissage</option>{spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
      <button disabled={pending}>{pending ? "…" : "Créer le rappel"}</button>
    </form>
  );
}
