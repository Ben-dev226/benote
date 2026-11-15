"use client";
import { useState } from "react";

type Msg = { role: "user" | "ai"; text: string };

export default function Chat({ agents, notes }: { agents: { slug: string; label: string }[]; notes: { id: string; title: string }[] }) {
  const [agent, setAgent] = useState(agents[0].slug);
  const [noteId, setNoteId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = prompt.trim(); if (!text || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]); setPrompt(""); setBusy(true);
    const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent, prompt: text, noteId: noteId || undefined }) });
    const j = await res.json().catch(() => ({}));
    setMsgs((m) => [...m, { role: "ai", text: res.ok ? `${j.text}\n\n— ${j.provider}` : `⚠ ${j.error ?? "Erreur"}` }]);
    setBusy(false);
  }
  return (
    <div className="stack">
      <div className="row">
        <select value={agent} onChange={(e) => setAgent(e.target.value)}>{agents.map((a) => <option key={a.slug} value={a.slug}>{a.label}</option>)}</select>
        <select value={noteId} onChange={(e) => setNoteId(e.target.value)} style={{ flex: 1 }}><option value="">Sans note en contexte</option>{notes.map((n) => <option key={n.id} value={n.id}>{n.title || "Sans titre"}</option>)}</select>
      </div>
      <div className="card chat">{msgs.length === 0 && <span className="mu">Pose une question, ou choisis une note et demande un résumé ou une fiche de révision.</span>}
        {msgs.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}{busy && <div className="mu">…</div>}</div>
      <div className="row"><input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Écris ta question…" style={{ flex: 1 }} /><button onClick={send} disabled={busy}>Envoyer</button></div>
    </div>
  );
}
