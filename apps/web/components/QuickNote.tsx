"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLinkedNote } from "@/app/(app)/library/actions";
import { fmtTime } from "@/lib/util";
import { toast } from "@/lib/toast";

export default function QuickNote({ resourceId, page, seconds, manualTime }: { resourceId: string; page?: number; seconds?: number; manualTime?: boolean }) {
  const [text, setText] = useState("");
  const [t, setT] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit() {
    if (!text.trim()) return;
    let sec = seconds;
    if (manualTime && t) { const [m, s] = t.split(":").map(Number); sec = (m || 0) * 60 + (s || 0); }
    start(async () => { await createLinkedNote(resourceId, { text, page, seconds: sec }); setText(""); toast("Note ajoutée et reliée"); router.refresh(); });
  }
  const ctx = page ? `page ${page}` : seconds !== undefined && !manualTime ? `à ${fmtTime(seconds)}` : "";
  return (
    <div className="stack">
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Nouvelle note ${ctx}`.trim()} />
      {manualTime && <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Instant (mm:ss, facultatif)" />}
      <button onClick={submit} disabled={pending}>{pending ? "…" : `Ajouter la note ${ctx}`.trim()}</button>
    </div>
  );
}
