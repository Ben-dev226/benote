"use client";
import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Bold, Code, Eye, Heading2, Image as ImageIcon, Italic, Link2, List, Maximize2, Minimize2, Pencil, Star, Table } from "lucide-react";
import { saveNote } from "../actions";
import { toast } from "@/lib/toast";

type Props = { id: string; title: string; content: string; spaceId: string | null; favorite: boolean; tags: string[]; spaces: { id: string; title: string }[]; allTags: string[] };

export default function NoteEditor(p: Props) {
  const [title, setTitle] = useState(p.title);
  const [content, setContent] = useState(p.content);
  const [spaceId, setSpaceId] = useState(p.spaceId ?? "");
  const [favorite, setFavorite] = useState(p.favorite);
  const [tags, setTags] = useState(p.tags.join(", "));
  const [preview, setPreview] = useState(false);
  const [focus, setFocus] = useState(false);
  const [status, setStatus] = useState("Enregistrée");
  const first = useRef(true);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("Modification…");
    const t = setTimeout(async () => {
      const r = await saveNote(p.id, { title, content, spaceId: spaceId || null, favorite, tags: tags.split(",") });
      setStatus(r.ok ? "Enregistrée" : "Non enregistrée");
      if (!r.ok) toast("La note n’a pas pu être enregistrée", "err");
      window.dispatchEvent(new CustomEvent("note-saved", { detail: { id: p.id, title, content, favorite, spaceId: spaceId || null } }));
    }, 800);
    return () => clearTimeout(t);
  }, [p.id, title, content, spaceId, favorite, tags]);

  useEffect(() => {
    document.documentElement.dataset.focus = focus ? "1" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.documentElement.dataset.focus = ""; };
  }, [focus]);

  function wrap(before: string, after = before) {
    const el = ta.current; if (!el) { setPreview(false); return; }
    const { selectionStart: s, selectionEnd: e } = el;
    setContent(content.slice(0, s) + before + (content.slice(s, e) || "texte") + after + content.slice(e));
    el.focus();
  }
  const add = (x: string) => setContent(content + (content && !content.endsWith("\n") ? "\n" : "") + x);
  const html = preview && typeof window !== "undefined" ? DOMPurify.sanitize(marked.parse(content, { async: false }) as string) : "";
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const B = ({ t, f, children }: { t: string; f: () => void; children: React.ReactNode }) => <button type="button" className="btn-icon sm" title={t} aria-label={t} onClick={f}>{children}</button>;

  return (
    <article className="stack" style={{ gap: 14 }}>
      <input className="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la note" aria-label="Titre" />
      <div className="row">
        <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} aria-label="Apprentissage"><option value="">Sans apprentissage</option>
          {p.spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <input list="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Étiquettes, séparées par des virgules" style={{ flex: 1, minWidth: 180 }} />
        <datalist id="tags">{p.allTags.map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      <div className="tb">
        <B t="Gras" f={() => wrap("**")}><Bold size={16} /></B>
        <B t="Italique" f={() => wrap("*")}><Italic size={16} /></B>
        <B t="Titre" f={() => add("## Titre")}><Heading2 size={16} /></B>
        <B t="Liste" f={() => add("- élément")}><List size={16} /></B>
        <B t="Tableau" f={() => add("| A | B |\n|---|---|\n| 1 | 2 |")}><Table size={16} /></B>
        <B t="Code" f={() => wrap("```\n", "\n```")}><Code size={16} /></B>
        <B t="Lien" f={() => wrap("[", "](https://)")}><Link2 size={16} /></B>
        <B t="Image" f={() => wrap("![", "](https://)")}><ImageIcon size={16} /></B>
        <span style={{ flex: 1 }} />
        <span className="mu" style={{ marginRight: 8 }}>{words} mots · {status}</span>
        <B t={favorite ? "Retirer des favoris" : "Mettre en favori"} f={() => setFavorite(!favorite)}><Star size={16} fill={favorite ? "currentColor" : "none"} /></B>
        <B t={preview ? "Modifier" : "Aperçu"} f={() => setPreview(!preview)}>{preview ? <Pencil size={16} /> : <Eye size={16} />}</B>
        <B t={focus ? "Quitter le mode concentration" : "Mode concentration"} f={() => setFocus(!focus)}>{focus ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</B>
      </div>
      {preview
        ? <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
        : <textarea ref={ta} className="paper" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Écris ici… (Markdown : titres, listes, tableaux, code)" />}
    </article>
  );
}
