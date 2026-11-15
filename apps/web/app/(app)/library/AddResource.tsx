"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import Dialog from "@/components/Dialog";
import SubmitButton from "@/components/SubmitButton";
import { addLink } from "./actions";
import UploadForm from "./UploadForm";

export default function AddResource({ spaces, drive, defaultSpace, defaultOpen }: { spaces: { id: string; title: string }[]; drive: string; defaultSpace?: string; defaultOpen?: boolean }) {
  const [tab, setTab] = useState<"file" | "link">(drive === "ok" ? "file" : "link");
  return (
    <Dialog trigger={<><Plus size={16} /> Ajouter</>} title="Ajouter une ressource" defaultOpen={defaultOpen}>
      <div className="tabs">
        <button type="button" className={tab === "file" ? "on" : ""} onClick={() => setTab("file")}>Fichier</button>
        <button type="button" className={tab === "link" ? "on" : ""} onClick={() => setTab("link")}>Lien / YouTube</button>
      </div>
      {tab === "file" ? (
        drive === "ok" ? <UploadForm spaces={spaces} defaultSpace={defaultSpace} /> : (
          <div className="stack"><span className="mu">{drive === "config" ? "Google Drive n’est pas encore configuré sur ce serveur." : "Connecte ton Google Drive pour envoyer des fichiers (PDF, audio, vidéo, images…)."}</span>
            <Link className="btn" href="/settings">Aller aux paramètres</Link></div>
        )
      ) : (
        <form action={addLink} className="stack">
          <input name="url" placeholder="https://… (site web ou vidéo YouTube)" required />
          <input name="name" placeholder="Nom (facultatif)" />
          <select name="space_id" defaultValue={defaultSpace ?? ""}><option value="">Sans apprentissage</option>{spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
          <SubmitButton>Ajouter le lien</SubmitButton>
        </form>
      )}
    </Dialog>
  );
}
