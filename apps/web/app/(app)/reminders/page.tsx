import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/util";
import ReminderForm from "./ReminderForm";
import RemRow from "./RemRow";

type R = { id: string; title: string; remind_at: string; done: boolean; recurrence: string | null; space_id: string | null };

export default async function Reminders({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await requireUser();
  const tab = searchParams.tab ?? "upcoming";
  let q = supabase.from("reminders").select("id,title,remind_at,done,recurrence,space_id").order("remind_at", { ascending: tab !== "past" });
  if (tab === "upcoming") q = q.eq("done", false);
  if (tab === "past") q = q.eq("done", true);
  const [rem, spaces, goalsRes] = await Promise.all([q, supabase.from("learning_spaces").select("id,title").order("title"), Promise.resolve(null)]);
  void goalsRes;
  const sl = (spaces.data ?? []) as { id: string; title: string }[];
  return (
    <>
      <h1>Rappels</h1>
      <div className="split">
        <div>
          <div className="row">{[["upcoming", "À venir"], ["past", "Terminés"], ["all", "Tous"]].map(([k, l]) => <Link key={k} className={`btn ${tab === k ? "" : "ghost"}`} href={`/reminders?tab=${k}`}>{l}</Link>)}</div>
          <div className="card sec0">
            {((rem.data ?? []) as R[]).map((r) => <RemRow key={r.id} id={r.id} title={r.title} when={fmtDateTime(r.remind_at)} done={r.done} rec={r.recurrence} space={sl.find((s) => s.id === r.space_id)?.title ?? ""} />)}
            {(rem.data ?? []).length === 0 && <span className="mu">Aucun rappel.</span>}
          </div>
        </div>
        <ReminderForm spaces={sl} />
      </div>
    </>
  );
}
