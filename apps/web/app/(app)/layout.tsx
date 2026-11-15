import Link from "next/link";
import { requireUser } from "@/lib/auth";
import NavLinks from "@/components/NavLinks";
import ReminderWatcher from "@/components/ReminderWatcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireUser();
  const { data: st } = await supabase.from("user_settings").select("theme").maybeSingle();
  return (
    <div className="shell" data-theme={st?.theme ?? "dark"}>
      <nav className="side">
        <Link href="/dashboard" className="logo">📖 myNotebook</Link>
        <NavLinks />
      </nav>
      <div className="content">
        <form action="/search" className="topbar">
          <input name="q" placeholder="Rechercher une note, un apprentissage, une ressource…" />
        </form>
        <ReminderWatcher />
        <main>{children}</main>
      </div>
    </div>
  );
}
