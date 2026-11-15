"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FolderOpen, FileText, GraduationCap, Home, LayoutGrid, Network, Settings, Sparkles } from "lucide-react";
import QuickCreate from "@/components/QuickCreate";

const DESKTOP = [
  ["/dashboard", Home, "Accueil"], ["/spaces", GraduationCap, "Mes apprentissages"], ["/library", FolderOpen, "Bibliothèque"], ["/notes", FileText, "Mes notes"],
  ["/map", Network, "Carte de connaissances"], ["/reminders", Bell, "Rappels"], ["/assistant", Sparkles, "Assistant IA"],
] as const;
const MOBILE = [["/dashboard", Home, "Accueil"], ["/notes", FileText, "Notes"], ["/library", FolderOpen, "Biblio."], ["/more", LayoutGrid, "Plus"]] as const;

export default function NavLinks({ mobile }: { mobile?: boolean }) {
  const path = usePathname();
  const on = (h: string) => path === h || path.startsWith(`${h}/`);
  if (mobile) {
    const [a, b, c, d] = MOBILE;
    const item = ([h, I, l]: readonly [string, typeof Home, string]) => <Link key={h} href={h} className={on(h) ? "on" : ""}><I size={20} /><span>{l}</span></Link>;
    return <>{item(a)}{item(b)}<QuickCreate fab />{item(c)}{item(d)}</>;
  }
  return (
    <>
      {DESKTOP.map(([h, I, l]) => <Link key={h} href={h} className={on(h) ? "on" : ""}><I size={18} /><span>{l}</span></Link>)}
      <div className="sep" />
      <Link href="/settings" className={on("/settings") ? "on" : ""}><Settings size={18} /><span>Paramètres</span></Link>
    </>
  );
}
