"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { accessTokenFor } from "@/lib/google";

export async function updateSettings(fd: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("user_settings").update({
    theme: fd.get("theme") === "light" ? "light" : "dark", ai_enabled: fd.get("ai_enabled") === "on",
  }).eq("user_id", user.id);
  revalidatePath("/", "layout");
}

// Détecte les fichiers supprimés ou mis à la corbeille dans Drive
export async function syncDrive() {
  const { supabase, user } = await requireUser();
  const t = await accessTokenFor(user.id);
  if (!t) redirect("/settings?sync=error");
  const { data } = await supabase.from("resources").select("id,drive_file_id").not("drive_file_id", "is", null).limit(200);
  let missing = 0;
  for (const r of (data ?? []) as { id: string; drive_file_id: string }[]) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${r.drive_file_id}?fields=id,trashed`, { headers: { Authorization: `Bearer ${t.token}` } });
    const gone = res.status === 404 || (res.ok && (await res.json()).trashed === true);
    if (gone) missing++;
    await supabase.from("resources").update({ drive_status: gone ? "missing" : "ok" }).eq("id", r.id);
  }
  revalidatePath("/library");
  redirect(`/settings?sync=${missing}`);
}

export async function toggleTheme() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("user_settings").select("theme").eq("user_id", user.id).maybeSingle();
  await supabase.from("user_settings").update({ theme: data?.theme === "light" ? "dark" : "light" }).eq("user_id", user.id);
  revalidatePath("/", "layout");
}
