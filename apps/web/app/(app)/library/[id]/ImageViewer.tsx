"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import QuickNote from "@/components/QuickNote";

export default function ImageViewer({ id, name, prev, next }: { id: string; name: string; prev: string | null; next: string | null }) {
  const [zoom, setZoom] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="stack">
      <div className="row toolbar">
        {prev && <Link className="btn ghost" href={`/library/${prev}`}>◀</Link>}
        <button className="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button>
        <button className="ghost" onClick={() => setZoom((z) => Math.min(5, z + 0.25))}>+</button>
        <button className="ghost" onClick={() => box.current?.requestFullscreen?.()}>⛶</button>
        {next && <Link className="btn ghost" href={`/library/${next}`}>▶</Link>}
      </div>
      <div ref={box} className="imgbox">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/resources/${id}/file`} alt={name} style={{ width: `${zoom * 100}%`, maxWidth: "none" }} />
      </div>
      <div className="card"><QuickNote resourceId={id} /></div>
    </div>
  );
}
