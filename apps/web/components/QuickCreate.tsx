"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell, FileText, FolderPlus, GraduationCap, Plus } from "lucide-react";
import { createNote } from "@/app/(app)/notes/actions";

export default function QuickCreate({ fab }: { fab?: boolean }) {
  const [open, setOpen] = useState(false);
  const shut = () => setTimeout(() => setOpen(false), 120);
  return (
    <div className={`qc ${fab ? "fab" : ""}`}>
      <button type="button" className={fab ? "fab-btn" : "btn"} onClick={() => setOpen(!open)} aria-label="Créer">
        <Plus size={fab ? 24 : 16} />{!fab && " Créer"}
      </button>
      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div className="menu" onClick={shut}>
            <form action={createNote}><button className="menu-i"><FileText size={16} /> Nouvelle note</button></form>
            <Link className="menu-i" href="/spaces?new=1"><GraduationCap size={16} /> Nouvel apprentissage</Link>
            <Link className="menu-i" href="/library?add=1"><FolderPlus size={16} /> Ajouter une ressource</Link>
            <Link className="menu-i" href="/reminders?new=1"><Bell size={16} /> Nouveau rappel</Link>
          </div>
        </>
      )}
    </div>
  );
}
