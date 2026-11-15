"use client";
import { useEffect, useState } from "react";

export default function TextViewer({ id }: { id: string }) {
  const [text, setText] = useState("Chargement…");
  useEffect(() => {
    fetch(`/api/resources/${id}/file`).then((r) => (r.ok ? r.text() : Promise.reject())).then(setText).catch(() => setText("Impossible de charger le fichier."));
  }, [id]);
  return <pre className="card txt">{text}</pre>;
}
