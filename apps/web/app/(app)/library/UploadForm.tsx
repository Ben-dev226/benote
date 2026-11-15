"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerDriveFile } from "./actions";

export default function UploadForm({ spaces }: { spaces: { id: string; title: string }[] }) {
  const [msg, setMsg] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    const spaceId = (form.elements.namedItem("space_id") as HTMLSelectElement).value;
    if (!file) return;
    setMsg(""); setPct(0);
    const s = await fetch("/api/drive/upload-session", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, mimeType: file.type || "application/octet-stream", size: file.size }),
    });
    const sj = await s.json();
    if (!s.ok) { setMsg(sj.error ?? "Erreur"); setPct(null); return; }
    // Envoi direct navigateur -> Google Drive
    const driveFile: { id: string } | null = await new Promise((resolve) => {
      const x = new XMLHttpRequest();
      x.open("PUT", sj.uploadUrl);
      x.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      x.upload.onprogress = (ev) => ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
      x.onload = () => { try { resolve(x.status < 300 ? JSON.parse(x.responseText) : null); } catch { resolve(null); } };
      x.onerror = () => resolve(null);
      x.send(file);
    });
    if (!driveFile) { setMsg("Échec de l’envoi vers Drive."); setPct(null); return; }
    const r = await registerDriveFile({ fileId: driveFile.id, spaceId: spaceId || null });
    setPct(null);
    if (!r.ok) { setMsg(r.error ?? "Erreur"); return; }
    form.reset(); setMsg("Fichier ajouté ✓"); router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="card stack">
      <h2>Envoyer un fichier vers mon Drive</h2>
      <input type="file" name="file" required />
      <select name="space_id"><option value="">Sans apprentissage</option>{spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
      <button disabled={pct !== null}>{pct !== null ? `Envoi… ${pct}%` : "Envoyer"}</button>
      {msg && <div className={msg.includes("✓") ? "ok" : "err"}>{msg}</div>}
    </form>
  );
}
