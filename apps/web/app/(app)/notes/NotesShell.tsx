"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Star } from "lucide-react";
import { createNote } from "./actions";
import { ago, colorFor } from "@/lib/util";

export type NoteItem = { id: string; title: string; excerpt: string; favorite: boolean; spaceId: string | null; updatedAt: string; tags: string[] };

export default function NotesShell({ notes, spaces, children }: { notes: NoteItem[]; spaces: { id: string; title: string }[]; children: React.ReactNode }) {
  const path = usePathname();
  const open = path !== "/notes";
  const [items, setItems] = useState(notes);
  const [q, setQ] = useState("");
  const [space, setSpace] = useState("");
  const [tag, setTag] = useState("");
  const [fav, setFav] = useState(false);

  useEffect(() => setItems(notes), [notes]);
  // Mise à jour instantanée de la liste pendant la frappe (envoyée par l'éditeur)
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; title: string; content: string; favorite: boolean; spaceId: string | null }>).detail;
      setItems((cur) => cur.map((n) => (n.id === d.id ? { ...n, title: d.title, excerpt: d.content.slice(0, 120), favorite: d.favorite, spaceId: d.spaceId, updatedAt: new Date().toISOString() } : n)));
    };
    window.addEventListener("note-saved", h);
    return () => window.removeEventListener("note-saved", h);
  }, []);

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((n) => n.tags))).sort(), [items]);
  const shown = items.filter((n) =>
    (!q || `${n.title} ${n.excerpt}`.toLowerCase().includes(q.toLowerCase())) && (!space || n.spaceId === space) && (!tag || n.tags.includes(tag)) && (!fav || n.favorite));

  return (
    <div className={`notes-shell ${open ? "open" : ""}`}>
      <aside className="card nlist stack">
        <div className="row between"><h2>Mes notes</h2>
          <form action={createNote}><button className="btn btn-sm"><Plus size={15} /> Nouvelle</button></form></div>
        <div className="search" style={{ maxWidth: "none" }}><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" /></div>
        <div className="row">
          <select value={space} onChange={(e) => setSpace(e.target.value)} style={{ flex: 1 }}><option value="">Tous les apprentissages</option>{spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
          <button className={fav ? "btn-icon" : "btn-icon"} style={fav ? { background: "var(--wa)", color: "#3a2a00" } : undefined} onClick={() => setFav(!fav)} aria-label="Favoris"><Star size={16} /></button>
        </div>
        {allTags.length > 0 && <div className="row">{allTags.slice(0, 12).map((t) => <button key={t} className="tag" style={tag === t ? { background: "var(--ac)", color: "#fff" } : { border: 0 }} onClick={() => setTag(tag === t ? "" : t)}>#{t}</button>)}</div>}
        <div className="stack" style={{ gap: 2 }}>
          {shown.map((n) => (
            <Link key={n.id} href={`/notes/${n.id}`} className={`nitem ${path === `/notes/${n.id}` ? "on" : ""}`}>
              <b>{n.favorite ? "⭐ " : ""}{n.title || "Sans titre"}</b>
              <div className="mu clamp">{n.excerpt || "Note vide"}</div>
              <div className="row" style={{ gap: 6 }}>
                {n.spaceId && <span className="chip" style={{ "--c": colorFor(n.spaceId) } as React.CSSProperties}><i />{spaces.find((s) => s.id === n.spaceId)?.title}</span>}
                <span className="mu">{ago(n.updatedAt)}</span>
              </div>
            </Link>
          ))}
          {shown.length === 0 && <span className="mu" style={{ padding: 10 }}>{items.length ? "Aucun résultat." : "Aucune note pour l’instant."}</span>}
        </div>
      </aside>
      <section className="npane">{children}</section>
    </div>
  );
}
