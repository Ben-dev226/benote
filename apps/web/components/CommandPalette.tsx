"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bot, CornerDownLeft, FileText, FolderOpen, GraduationCap, Home, Network, Plus, Search, Settings } from "lucide-react";
import { searchAll, type Hit } from "@/app/(app)/search/actions";
import { createNote } from "@/app/(app)/notes/actions";

type Item = { key: string; label: string; sub?: string; icon: React.ReactNode; group: string; href?: string; run?: () => void };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [i, setI] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    const op = () => setOpen(true);
    window.addEventListener("keydown", key);
    window.addEventListener("open-palette", op);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("open-palette", op); };
  }, []);
  useEffect(() => { if (open) { setQ(""); setHits([]); setI(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => {
    const t = setTimeout(async () => setHits(q.trim().length >= 2 ? await searchAll(q).catch(() => []) : []), 160);
    return () => clearTimeout(t);
  }, [q]);

  const items = useMemo<Item[]>(() => {
    const ic = (I: typeof Home) => <I size={16} />;
    const base: Item[] = [
      { key: "a1", group: "Créer", label: "Nouvelle note", icon: ic(Plus), run: () => { createNote(new FormData()); } },
      { key: "a2", group: "Créer", label: "Nouvel apprentissage", icon: ic(GraduationCap), href: "/spaces?new=1" },
      { key: "a3", group: "Créer", label: "Ajouter une ressource", icon: ic(FolderOpen), href: "/library?add=1" },
      { key: "a4", group: "Créer", label: "Nouveau rappel", icon: ic(Bell), href: "/reminders?new=1" },
      { key: "g1", group: "Aller à", label: "Aujourd’hui", icon: ic(Home), href: "/dashboard" },
      { key: "g2", group: "Aller à", label: "Notes", icon: ic(FileText), href: "/notes" },
      { key: "g3", group: "Aller à", label: "Bibliothèque", icon: ic(FolderOpen), href: "/library" },
      { key: "g4", group: "Aller à", label: "Rappels", icon: ic(Bell), href: "/reminders" },
      { key: "g5", group: "Aller à", label: "Carte des connaissances", icon: ic(Network), href: "/map" },
      { key: "g6", group: "Aller à", label: "Assistant IA", icon: ic(Bot), href: "/assistant" },
      { key: "g7", group: "Aller à", label: "Paramètres", icon: ic(Settings), href: "/settings" },
    ];
    const f = q.trim().toLowerCase();
    const acts = f ? base.filter((x) => x.label.toLowerCase().includes(f)) : base;
    const found: Item[] = hits.map((h) => ({ key: h.type + h.id, group: h.type === "note" ? "Notes" : h.type === "space" ? "Apprentissages" : "Ressources", label: h.title, sub: h.sub, href: h.href,
      icon: h.type === "note" ? ic(FileText) : h.type === "space" ? ic(GraduationCap) : ic(FolderOpen) }));
    return [...found, ...acts];
  }, [q, hits]);

  function go(it: Item) { setOpen(false); if (it.href) router.push(it.href); else it.run?.(); }
  if (!open) return null;
  let last = "";
  return (
    <div className="pal-scrim" onClick={() => setOpen(false)}>
      <div className="pal" role="dialog" aria-label="Recherche et commandes" onClick={(e) => e.stopPropagation()}>
        <div className="pal-in"><Search size={18} />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} placeholder="Chercher une note, une ressource, ou taper une action…"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(items.length - 1, x + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
              if (e.key === "Enter" && items[i]) go(items[i]);
            }} /></div>
        <div className="pal-list">
          {items.map((it, idx) => {
            const head = it.group !== last ? (last = it.group) : null;
            return (
              <div key={it.key}>
                {head && <div className="pal-g">{head}</div>}
                <button className={`pal-i ${idx === i ? "on" : ""}`} onMouseEnter={() => setI(idx)} onClick={() => go(it)}>
                  {it.icon}<span className="pal-t">{it.label}{it.sub && <small>{it.sub}</small>}</span>{idx === i && <CornerDownLeft size={14} />}
                </button>
              </div>
            );
          })}
          {items.length === 0 && <div className="pal-g" style={{ padding: 16 }}>Aucun résultat pour « {q} ».</div>}
        </div>
      </div>
    </div>
  );
}
