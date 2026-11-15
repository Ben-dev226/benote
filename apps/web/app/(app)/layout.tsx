import Link from "next/link";
import { Bell, BookOpen, Cloud, Moon, Search, Sun } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { driveInfo } from "@/lib/google";
import NavLinks from "@/components/NavLinks";
import QuickCreate from "@/components/QuickCreate";
import ReminderWatcher from "@/components/ReminderWatcher";
import { toggleTheme } from "./settings/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [st, prof, due, drive] = await Promise.all([
    supabase.from("user_settings").select("theme").maybeSingle(),
    supabase.from("users").select("display_name").maybeSingle(),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("done", false).lte("remind_at", new Date().toISOString()),
    driveInfo(user.id),
  ]);
  const theme = st.data?.theme ?? "dark";
  const name = prof.data?.display_name ?? user.email ?? "";
  return (
    <div className="app" data-theme={theme}>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><span className="logo"><BookOpen size={19} /></span><span>myNotebook<small>Apprendre • Organiser • Réussir</small></span></Link>
        <nav className="nav"><NavLinks /></nav>
        <div className="sb-grow" />
        <Link href="/settings" className="sbcard">
          <div className="row"><Cloud size={16} /><b>Google Drive</b></div>
          <div className={drive.status === "ok" ? "ok" : "mu"}>{drive.status === "ok" ? `Connecté ${drive.email ?? ""}` : "Non connecté — cliquer pour connecter"}</div>
        </Link>
        <div className="usercard"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span style={{ minWidth: 0 }}><b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</b><span className="mu">Étudiant curieux</span></span></div>
      </aside>
      <div className="col">
        <div className="topbar">
          <form action="/search" className="search"><Search size={16} /><input name="q" placeholder="Rechercher une note, un apprentissage, une ressource…" /></form>
          <form action={toggleTheme}><button className="btn-icon" aria-label="Changer de thème">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button></form>
          <Link href="/reminders" className="btn-icon" aria-label="Rappels" style={{ position: "relative" }}><Bell size={18} />
            {(due.count ?? 0) > 0 && <span className="avatar" style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, fontSize: 11, background: "#ef4444" }}>{due.count}</span>}</Link>
          <QuickCreate />
        </div>
        <ReminderWatcher />
        <div className="page">{children}</div>
      </div>
      <nav className="mnav"><NavLinks mobile /></nav>
    </div>
  );
}
