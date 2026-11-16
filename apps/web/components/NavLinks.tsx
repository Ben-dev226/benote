"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileText, FolderOpen, Home, LayoutGrid, Network, Sparkles } from "lucide-react";
import QuickCreate from "@/components/QuickCreate";

const DESKTOP = [
  ["/dashboard", Home, "Aujourd’hui"], ["/notes", FileText, "Notes"], ["/library", FolderOpen, "Bibliothèque"],
  ["/reminders", Bell, "Rappels"], ["/map", Network, "Carte"], ["/assistant", Sparkles, "Assistant"],
] as const;
const MOBILE = [["/dashboard", Home, "Aujourd’hui"], ["/notes", FileText, "Notes"], ["/library", FolderOpen, "Biblio."], ["/more", LayoutGrid, "Plus"]] as const;

export default function NavLinks({ mobile }: { mobile?: boolean }) {
  const path = usePathname();
  const on = (h: string) => path === h || path.startsWith(`${h}/`);
  if (mobile) {
    const item = ([h, I, l]: readonly [string, typeof Home, string]) => <Link key={h} href={h} className={on(h) ? "on" : ""}><I size={20} /><span>{l}</span></Link>;
    return <>{item(MOBILE[0])}{item(MOBILE[1])}<QuickCreate fab />{item(MOBILE[2])}{item(MOBILE[3])}</>;
  }
  return <>{DESKTOP.map(([h, I, l]) => <Link key={h} href={h} className={on(h) ? "on" : ""}><I size={17} /><span className="lbl">{l}</span></Link>)}</>;
}
