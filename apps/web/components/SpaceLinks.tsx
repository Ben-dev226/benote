"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { colorFor } from "@/lib/util";

export default function SpaceLinks({ spaces }: { spaces: { id: string; title: string; icon: string | null }[] }) {
  const path = usePathname();
  return (
    <div className="sp-list">
      {spaces.map((s) => (
        <Link key={s.id} href={`/spaces/${s.id}`} className={`sp-link ${path === `/spaces/${s.id}` ? "on" : ""}`} style={{ "--c": colorFor(s.id) } as React.CSSProperties}>
          <i /><span>{s.icon} {s.title}</span>
        </Link>
      ))}
      {spaces.length === 0 && <span className="mu" style={{ padding: "4px 10px" }}>Aucun pour l’instant</span>}
    </div>
  );
}
