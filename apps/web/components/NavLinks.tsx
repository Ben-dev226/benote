"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "🏠", "Accueil"], ["/spaces", "📚", "Apprentissages"], ["/notes", "📝", "Notes"], ["/library", "📁", "Bibliothèque"],
  ["/map", "🕸️", "Carte"], ["/reminders", "🔔", "Rappels"], ["/assistant", "✨", "Assistant"], ["/settings", "⚙️", "Paramètres"],
];
export default function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map(([href, icon, label]) => (
        <Link key={href} href={href} className={path.startsWith(href) ? "on" : ""}><span>{icon}</span><em>{label}</em></Link>
      ))}
    </>
  );
}
