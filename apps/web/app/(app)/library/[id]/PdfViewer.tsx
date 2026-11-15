"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { addBookmark, deleteAnnotation, saveProgress } from "../actions";
import QuickNote from "@/components/QuickNote";

type Props = { id: string; initialPage: number; bookmarks: { id: string; page: number }[] };

export default function PdfViewer({ id, initialPage, bookmarks }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    let dead = false;
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      const d = await pdfjs.getDocument({ url: `/api/resources/${id}/file`, withCredentials: true }).promise;
      if (!dead) { setDoc(d); setPage((p) => Math.min(Math.max(1, p), d.numPages)); }
    })().catch(() => setErr("Impossible de charger ce PDF (fichier absent de Drive ?)."));
    return () => { dead = true; };
  }, [id]);

  useEffect(() => {
    if (!doc || !canvas.current) return;
    let task: RenderTask | undefined;
    (async () => {
      const p = await doc.getPage(page);
      const base = p.getViewport({ scale: 1 });
      const dpr = window.devicePixelRatio || 1;
      const scale = ((box.current?.clientWidth ?? 800) / base.width) * zoom;
      const vp = p.getViewport({ scale: scale * dpr });
      const c = canvas.current!;
      c.width = vp.width; c.height = vp.height;
      c.style.width = `${vp.width / dpr}px`; c.style.height = `${vp.height / dpr}px`;
      task = p.render({ canvasContext: c.getContext("2d")!, viewport: vp });
      await task.promise;
    })().catch(() => undefined);
    return () => task?.cancel();
  }, [doc, page, zoom]);

  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => saveProgress(id, { page, percent: (page / doc.numPages) * 100 }), 1000);
    return () => clearTimeout(t);
  }, [doc, page, id]);

  const total = doc?.numPages ?? 0;
  const go = (n: number) => setPage(Math.min(Math.max(1, n), total || 1));
  if (err) return <div className="card err">{err}</div>;
  return (
    <div className="stack">
      <div className="row toolbar">
        <button className="ghost" onClick={() => go(page - 1)}>◀</button>
        <input type="number" value={page} min={1} max={total || 1} onChange={(e) => go(Number(e.target.value))} style={{ width: 70 }} />
        <span className="mu">/ {total || "…"}</span>
        <button className="ghost" onClick={() => go(page + 1)}>▶</button>
        <button className="ghost" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>−</button>
        <button className="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>+</button>
        <button className="ghost" onClick={() => box.current?.requestFullscreen?.()}>⛶</button>
        <button className="ghost" onClick={async () => { await addBookmark(id, page); router.refresh(); }}>🔖 Signet</button>
      </div>
      <div ref={box} className="pdfbox"><canvas ref={canvas} /></div>
      {bookmarks.length > 0 && (
        <div className="row">{bookmarks.map((b) => (
          <span key={b.id} className="tag"><button className="link" onClick={() => go(b.page)}>🔖 p. {b.page}</button>
            <button className="link" onClick={async () => { const f = new FormData(); f.set("id", b.id); f.set("resource_id", id); await deleteAnnotation(f); router.refresh(); }}>✕</button></span>
        ))}</div>
      )}
      <div className="card"><QuickNote resourceId={id} page={page} /></div>
    </div>
  );
}
