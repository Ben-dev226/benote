"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

type Node = { id: string; title: string; group: number };
const W = 900, H = 600;
const COLORS = ["#6d5dfc", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#fb923c"];

export default function KnowledgeMap({ nodes, links }: { nodes: Node[]; links: { a: string; b: string }[] }) {
  const router = useRouter();
  const pos = useMemo(() => {
    const n = nodes.length;
    const p = nodes.map((_, i) => ({ x: W / 2 + Math.cos((i / n) * 2 * Math.PI) * 250, y: H / 2 + Math.sin((i / n) * 2 * Math.PI) * 220 }));
    const idx = new Map(nodes.map((x, i) => [x.id, i]));
    const ls = links.map((l) => [idx.get(l.a), idx.get(l.b)] as const).filter((l): l is readonly [number, number] => l[0] !== undefined && l[1] !== undefined);
    for (let it = 0; it < 250; it++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const dx = p[i].x - p[j].x, dy = p[i].y - p[j].y, d2 = dx * dx + dy * dy + 0.5, f = 5000 / d2, d = Math.sqrt(d2);
        p[i].x += (dx / d) * f; p[i].y += (dy / d) * f; p[j].x -= (dx / d) * f; p[j].y -= (dy / d) * f;
      }
      for (const [a, b] of ls) {
        const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (d - 110) * 0.02;
        p[a].x += (dx / d) * f; p[a].y += (dy / d) * f; p[b].x -= (dx / d) * f; p[b].y -= (dy / d) * f;
      }
      for (const q of p) { q.x += (W / 2 - q.x) * 0.01; q.y += (H / 2 - q.y) * 0.01; q.x = Math.min(W - 40, Math.max(40, q.x)); q.y = Math.min(H - 30, Math.max(30, q.y)); }
    }
    return p;
  }, [nodes, links]);
  const idx = new Map(nodes.map((x, i) => [x.id, i]));
  if (!nodes.length) return <div className="card mu">Aucune note pour l’instant.</div>;
  return (
    <div className="card" style={{ overflow: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 600 }}>
        {links.map((l, i) => { const a = pos[idx.get(l.a) ?? 0], b = pos[idx.get(l.b) ?? 0]; return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8a90c0" strokeWidth={1.5} opacity={0.6} />; })}
        {nodes.map((n, i) => (
          <g key={n.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/notes/${n.id}`)}>
            <circle cx={pos[i].x} cy={pos[i].y} r={11} fill={COLORS[n.group % COLORS.length]} />
            <text x={pos[i].x} y={pos[i].y + 26} textAnchor="middle" fontSize="12" fill="currentColor">{(n.title || "Sans titre").slice(0, 22)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
