"use client";
import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { saveNote } from "../actions";

type Props = { id: string; title: string; content: string; spaceId: string | null; favorite: boolean; tags: string[]; spaces: { id: string; title: string }[]; allTags: string[] };

export default function NoteEditor(p: Props) {
  const [title, setTitle] = useState(p.title);
  const [content, setContent] = useState(p.content);
  const [spaceId, setSpaceId] = useState(p.spaceId ?? "");
  const [favorite, setFavorite] = useState(p.favorite);
  const [tags, setTags] = useState(p.tags.join(", "));
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("Enregistré");
  const first = useRef(true);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("Modification…");
    const t = setTimeout(async () => {
      const r = await saveNote(p.id, { title, content, spaceId: spaceId || null, favorite, tags: tags.split(",") });
      setStatus(r.ok ? "Enregistré ✓" : "Erreur d’enregistrement");
      window.dispatchEvent(new CustomEvent("note-saved", { detail: { id: p.id, title, content, favorite, spaceId: spaceId || null } }));
    }, 800);
    return () => clearTimeout(t);
  }, [p.id, title, content, spaceId, favorite, tags]);

  function wrap(before: string, after = before) {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    setContent(content.slice(0, s) + before + (content.slice(s, e) || "texte") + after + content.slice(e));
    el.focus();
  }
  const prefix = (x: string) => setContent(content + (content && !content.endsWith("\n") ? "\n" : "") + x);
  const html = preview && typeof window !== "undefined" ? DOMPurify.sanitize(marked.parse(content, { async: false }) as string) : "";

  return (
    <div className="card stack">
      <input className="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
      <div className="row">
        <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)}><option value="">Sans apprentissage</option>
          {p.spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <button className="ghost" onClick={() => setFavorite(!favorite)}>{favorite ? "⭐ Favori" : "☆ Favori"}</button>
        <input list="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Étiquettes (séparées par des virgules)" style={{ flex: 1, minWidth: 180 }} />
        <datalist id="tags">{p.allTags.map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      <div className="row toolbar">
        <button className="ghost" onClick={() => wrap("**")}><b>B</b></button>
        <button className="ghost" onClick={() => wrap("*")}><i>I</i></button>
        <button className="ghost" onClick={() => prefix("## Titre")}>H2</button>
        <button className="ghost" onClick={() => prefix("- élément")}>• Liste</button>
        <button className="ghost" onClick={() => prefix("| A | B |\n|---|---|\n| 1 | 2 |")}>Tableau</button>
        <button className="ghost" onClick={() => wrap("```\n", "\n```")}>{"</>"}</button>
        <button className="ghost" onClick={() => wrap("[", "](https://)")}>🔗</button>
        <button className="ghost" onClick={() => wrap("![", "](https://)")}>🖼️</button>
        <button className={preview ? "" : "ghost"} onClick={() => setPreview(!preview)}>{preview ? "Éditer" : "Aperçu"}</button>
        <span className="mu" style={{ marginLeft: "auto" }}>{status}</span>
      </div>
      {preview
        ? <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
        : <textarea ref={ta} rows={18} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Écris en Markdown : titres, listes, tableaux, code…" />}
    </div>
  );
}
