import Link from "next/link";
import { FileText, Film, Image as ImageIcon, Link2, Music, Paperclip } from "lucide-react";
import { colorFor, KIND_COLOR } from "@/lib/util";

export function KindIcon({ kind, size = 18 }: { kind: string; size?: number }) {
  const P = { document: FileText, video: Film, image: ImageIcon, audio: Music, link: Link2 }[kind] ?? Paperclip;
  return <P size={size} />;
}
export function KindTile({ kind }: { kind: string }) {
  const c = KIND_COLOR[kind] ?? KIND_COLOR.other;
  return <span className="tile" style={{ background: `${c}26`, color: c }}><KindIcon kind={kind} /></span>;
}
export function SpaceChip({ space, plain }: { space: { id: string; title: string } | null | undefined; plain?: boolean }) {
  if (!space) return null;
  const style = { "--c": colorFor(space.id) } as React.CSSProperties;
  return plain
    ? <span className="chip" style={style}><i />{space.title}</span>
    : <Link href={`/spaces/${space.id}`} className="chip" style={style}><i />{space.title}</Link>;
}
export function ProgressRing({ value, size = 84, stroke = 9, color = "#6d5dfc" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sf3)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(c * Math.max(0, Math.min(100, value))) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" fontWeight="700" fontSize={size / 4}>{value}%</text>
    </svg>
  );
}
export function Empty({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return <div className="empty"><div className="empty-i">{icon}</div><b>{title}</b>{children && <div className="mu">{children}</div>}</div>;
}
