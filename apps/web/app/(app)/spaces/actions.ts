"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { str } from "@/lib/util";

const refresh = () => { revalidatePath("/spaces"); revalidatePath("/dashboard"); };

// La progression d'un apprentissage suit ses objectifs dès qu'il en a.
async function syncProgress(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], spaceId: string) {
  const { data } = await supabase.from("learning_goals").select("done").eq("space_id", spaceId);
  const goals = (data ?? []) as { done: boolean }[];
  if (!goals.length) return;
  await supabase.from("learning_spaces").update({ progress: Math.round((goals.filter((g) => g.done).length / goals.length) * 100) }).eq("id", spaceId);
  refresh();
}

export async function createSpace(fd: FormData) {
  const { supabase, user } = await requireUser();
  const title = str(fd, "title", 120);
  if (!title) return;
  const { data } = await supabase.from("learning_spaces").insert({
    user_id: user.id, title, description: str(fd, "description"), icon: str(fd, "icon", 8) || "📘", category: str(fd, "category", 60) || null,
  }).select("id").single();
  await logActivity(supabase, user.id, "space_created", "learning_space", data?.id, { title }, data?.id);
  refresh();
}
export async function updateSpace(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  const patch: Record<string, unknown> = {
    title: str(fd, "title", 120) || "Sans titre", description: str(fd, "description"), icon: str(fd, "icon", 8) || "📘",
    category: str(fd, "category", 60) || null,
  };
  if (fd.has("progress")) patch.progress = Math.min(100, Math.max(0, parseInt(str(fd, "progress", 3), 10) || 0));
  await supabase.from("learning_spaces").update(patch).eq("id", id);
  refresh(); revalidatePath(`/spaces/${id}`);
}
export async function setSpaceStatus(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  await supabase.from("learning_spaces").update({ status: str(fd, "status") === "archived" ? "archived" : "active" }).eq("id", id);
  refresh(); revalidatePath(`/spaces/${id}`);
}
export async function deleteSpace(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("learning_spaces").delete().eq("id", str(fd, "id"));
  refresh();
  redirect("/spaces");
}
export async function moveSpace(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id"); const dir = str(fd, "dir") === "up" ? -1 : 1;
  const { data } = await supabase.from("learning_spaces").select("id").eq("status", "active").order("position").order("created_at", { ascending: false });
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  const i = ids.indexOf(id); const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((x, pos) => supabase.from("learning_spaces").update({ position: pos }).eq("id", x)));
  refresh();
}
export async function addGoal(fd: FormData) {
  const { supabase, user } = await requireUser();
  const space = str(fd, "space_id"); const title = str(fd, "title", 200);
  if (!title) return;
  await supabase.from("learning_goals").insert({ user_id: user.id, space_id: space, title, target_date: str(fd, "target_date", 10) || null });
  await syncProgress(supabase, space);
  revalidatePath(`/spaces/${space}`);
}
export async function toggleGoal(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("learning_goals").update({ done: str(fd, "done") !== "true" }).eq("id", str(fd, "id"));
  await syncProgress(supabase, str(fd, "space_id"));
  revalidatePath(`/spaces/${str(fd, "space_id")}`);
}
export async function deleteGoal(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("learning_goals").delete().eq("id", str(fd, "id"));
  await syncProgress(supabase, str(fd, "space_id"));
  revalidatePath(`/spaces/${str(fd, "space_id")}`);
}
