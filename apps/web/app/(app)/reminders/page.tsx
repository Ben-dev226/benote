import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import Dialog from "@/components/Dialog";
import { Empty } from "@/components/ui";
import { colorFor, dayBucket, fmtDateTime } from "@/lib/util";
import ReminderForm from "./ReminderForm";
import RemRow from "./RemRow";

type R = { id: string; title: string; remind_at: string; done: boolean; recurrence: string | null; space_id: string | null };
const ORDER = ["En retard", "Aujourd’hui", "Demain", "Plus tard"];

export default async function Reminders({ searchParams }: { searchParams: { tab?: string; new?: string } }) {
  const { supabase } = await requireUser();
  const tab = searchParams.tab ?? "upcoming";
  let q = supabase.from("reminders").select("id,title,remind_at,done,recurrence,space_id").order("remind_at", { ascending: tab !== "past" });
  if (tab === "upcoming") q = q.eq("done", false);
  if (tab === "past") q = q.eq("done", true);
  const [rem, spaces] = await Promise.all([q, supabase.from("learning_spaces").select("id,title").order("title")]);
  const sl = (spaces.data ?? []) as { id: string; title: string }[];
  const list = (rem.data ?? []) as R[];
  const groups = tab === "upcoming" ? ORDER.map((g) => [g, list.filter((r) => dayBucket(r.remind_at) === g)] as const).filter(([, l]) => l.length) : [[tab === "past" ? "Terminés" : "Tous", list] as const];
  return (
    <>
      <div className="page-h">
        <div><h1>Rappels</h1><p>Planifie tes séances d’étude, liées à tes apprentissages.</p></div>
        <Dialog trigger={<><Plus size={16} /> Nouveau rappel</>} title="Nouveau rappel" defaultOpen={searchParams.new === "1"}><ReminderForm spaces={sl} /></Dialog>
      </div>
      <div className="tabs">{[["upcoming", "À venir"], ["past", "Terminés"], ["all", "Tous"]].map(([k, l]) => <Link key={k} className={tab === k ? "on" : ""} href={`/reminders?tab=${k}`}>{l}</Link>)}</div>
      {list.length === 0 && <div className="card"><Empty icon={<Bell size={24} />} title="Aucun rappel">Crée un rappel pour ne pas oublier ta prochaine séance.</Empty></div>}
      {groups.map(([g, l]) => (
        <div key={g} className="card" style={{ marginBottom: 14 }}>
          <div className="card-h"><h2 style={g === "En retard" ? { color: "var(--er)" } : undefined}>{g}</h2><span className="mu">{l.length}</span></div>
          {l.map((r) => <RemRow key={r.id} id={r.id} title={r.title} when={fmtDateTime(r.remind_at)} done={r.done} rec={r.recurrence} space={sl.find((s) => s.id === r.space_id)?.title ?? ""} color={colorFor(r.space_id)} />)}
        </div>
      ))}
    </>
  );
}
