import Link from "next/link";
import { Bell, GraduationCap, Network, Settings, Sparkles } from "lucide-react";

export default function More() {
  const items = [["/spaces", GraduationCap, "Mes apprentissages"], ["/map", Network, "Carte de connaissances"], ["/reminders", Bell, "Rappels"], ["/assistant", Sparkles, "Assistant IA"], ["/settings", Settings, "Paramètres"]] as const;
  return (
    <>
      <div className="page-h"><h1>Menu</h1></div>
      <div className="card">{items.map(([h, I, l]) => <Link key={h} href={h} className="li"><span className="tile" style={{ background: "var(--sf2)" }}><I size={18} /></span><span className="li-main"><b>{l}</b></span></Link>)}</div>
    </>
  );
}
