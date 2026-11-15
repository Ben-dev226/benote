"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { str } from "@/lib/util";

function advance(from: Date, rec: string) {
  const d = new Date(from);
  const now = new Date();
  do {
    if (rec === "daily") d.setDate(d.getDate() + 1);
    else if (rec === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  } while (d <= now);
  return d;
}
const refresh = () => { revalidatePath("/reminders"); revalidatePath("/dashboard"); };

export async function createReminder(fd: FormData) {
  const { supabase, user } = await requireUser();
  const title = str(fd, "title", 200); const at = new Date(str(fd, "remind_at", 40));
  if (!title || isNaN(at.getTime())) return;
  const rec = str(fd, "recurrence", 10);
  const space = str(fd, "space_id") || null;
  const { data } = await supabase.from("reminders").insert({
    user_id: user.id, title, remind_at: at.toISOString(), space_id: space, recurrence: ["daily", "weekly", "monthly"].includes(rec) ? rec : null,
  }).select("id").single();
  await logActivity(supabase, user.id, "reminder_created", "reminder", data?.id, { title }, space);
  refresh();
}
export async function toggleReminder(id: string) {
  const { supabase } = await requireUser();
  const { data: r } = await supabase.from("reminders").select("done,recurrence,remind_at").eq("id", id).maybeSingle();
  if (!r) return;
  if (!r.done && r.recurrence) await supabase.from("reminders").update({ remind_at: advance(new Date(r.remind_at), r.recurrence).toISOString() }).eq("id", id);
  else await supabase.from("reminders").update({ done: !r.done }).eq("id", id);
  refresh();
}
export async function deleteReminder(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("reminders").delete().eq("id", id);
  refresh();
}
export async function getDueReminders() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("reminders").select("id,title,remind_at").eq("done", false).lte("remind_at", new Date().toISOString()).order("remind_at").limit(10);
  return (data ?? []) as { id: string; title: string; remind_at: string }[];
}
