import Link from "next/link";
import { Cloud, Moon, NotebookPen, Plus, Settings, Sun } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { driveInfo } from "@/lib/google";
import NavLinks from "@/components/NavLinks";
import QuickCreate from "@/components/QuickCreate";
import ReminderWatcher from "@/components/ReminderWatcher";
import CommandPalette from "@/components/CommandPalette";
import SearchButton from "@/components/SearchButton";
import SpaceLinks from "@/components/SpaceLinks";
import SubmitButton from "@/components/SubmitButton";
import Toaster from "@/components/Toaster";
import { createNote } from "./notes/actions";
import { toggleTheme } from "./settings/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [st, prof, drive, spaces] = await Promise.all([
    supabase.from("user_settings").select("theme").maybeSingle(),
    supabase.from("users").select("display_name").maybeSingle(),
    driveInfo(user.id),
    supabase.from("learning_spaces").select("id,title,icon").eq("status", "active").order("position").order("created_at", { ascending: false }).limit(30),
  ]);
  const theme = st.data?.theme ?? "dark";
  const name = prof.data?.display_name ?? user.email ?? "";
  return (
    <div className="app" data-theme={theme}>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><span className="mark"><NotebookPen size={17} /></span>myNotebook</Link>
        <form action={createNote}><SubmitButton className="btn newnote"><Plus size={16} /> Nouvelle note</SubmitButton></form>
        <SearchButton />
        <nav className="nav"><NavLinks /></nav>
        <div className="side-h"><Link href="/spaces">Apprentissages</Link><Link href="/spaces?new=1" aria-label="Nouvel apprentissage" className="btn-icon sm"><Plus size={14} /></Link></div>
        <SpaceLinks spaces={(spaces.data ?? []) as { id: string; title: string; icon: string | null }[]} />
        <div className="sb-grow" />
        <Link href="/settings" className="drive"><Cloud size={14} /><span className={drive.status === "ok" ? "" : "mu"}>{drive.status === "ok" ? "Drive connecté" : "Connecter Google Drive"}</span></Link>
        <div className="userrow">
          <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
          <span className="uname">{name}</span>
          <form action={toggleTheme}><button className="btn-icon sm" aria-label="Changer de thème">{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button></form>
          <Link href="/settings" className="btn-icon sm" aria-label="Paramètres"><Settings size={16} /></Link>
        </div>
      </aside>
      <div className="col">
        <header className="mtop"><Link href="/dashboard" className="brand" style={{ padding: 0 }}><span className="mark"><NotebookPen size={16} /></span>myNotebook</Link><SearchButton compact /></header>
        <ReminderWatcher />
        <div className="page">{children}</div>
      </div>
      <nav className="mnav"><NavLinks mobile /></nav>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
