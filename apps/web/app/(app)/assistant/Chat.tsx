"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };
type Attempt = { provider: string; model?: string; error: string };

export default function Chat({ agents, notes, initial, presetAgent, presetPrompt }: {
  agents: { slug: string; label: string }[]; notes: { id: string; title: string }[]; initial: Msg[]; presetAgent?: string; presetPrompt?: string;
}) {
  const [agent, setAgent] = useState(agents.some((a) => a.slug === presetAgent) ? presetAgent! : agents[0].slug);
  const [noteId, setNoteId] = useState("");
  const [prompt, setPrompt] = useState(presetPrompt ?? "");
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function send(text = prompt) {
    text = text.trim(); if (!text || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]); setPrompt(""); setBusy(true);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent, prompt: text, noteId: noteId || undefined }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setMsgs((m) => [...m, { role: "ai", text: `${j.text}\n\n— ${j.provider}${j.model ? ` · ${j.model}` : ""}` }]);
      else {
        const det = ((j.attempts ?? []) as Attempt[]).map((a) => `• ${a.provider}${a.model ? ` (${a.model})` : ""} : ${a.error}`).join("\n");
        setMsgs((m) => [...m, { role: "ai", text: `⚠ ${j.error ?? "Erreur"}${det ? `\n\n${det}` : ""}` }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "⚠ Connexion impossible." }]);
    }
    setBusy(false);
  }
  const chips: [string, string, string][] = [["Donne-moi un résumé", "synthese", "Résume cette note."], ["Créer une fiche", "revision", "Crée une fiche de révision avec des questions."], ["Pose une question", "professeur", "Pose-moi une question pour tester ma compréhension."]];
  return (
    <div className="stack">
      <div className="row">
        <select value={agent} onChange={(e) => setAgent(e.target.value)}>{agents.map((a) => <option key={a.slug} value={a.slug}>{a.label}</option>)}</select>
        <select value={noteId} onChange={(e) => setNoteId(e.target.value)} style={{ flex: 1 }}><option value="">Sans note en contexte</option>{notes.map((n) => <option key={n.id} value={n.id}>📝 {n.title || "Sans titre"}</option>)}</select>
      </div>
      <div className="panel chat">
        {msgs.length === 0 && <div className="row" style={{ flexWrap: "nowrap" }}><span className="bot"><Bot size={30} /></span><span className="mu">Salut ! Choisis une note en contexte si tu veux que je travaille dessus, puis pose ta question.</span></div>}
        {msgs.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
        {busy && <div className="mu">L’assistant réfléchit…</div>}
        <div ref={end} />
      </div>
      <div className="row">{chips.map(([l, a, p]) => <button key={l} className="tag" style={{ border: 0, cursor: "pointer" }} onClick={() => { setAgent(a); setPrompt(p); }}>{l}</button>)}</div>
      <div className="row" style={{ flexWrap: "nowrap" }}><input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Pose ta question…" /><button onClick={() => send()} disabled={busy} aria-label="Envoyer"><Send size={16} /></button></div>
    </div>
  );
}
