"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { str } from "@/lib/util";

export async function createNote(fd: FormData) {
  const { supabase, user } = await requireUser();
  const space = str(fd, "space_id") || null;
  const { data } = await supabase.from("notes").insert({ user_id: user.id, space_id: space, title: "Nouvelle note", content: "" }).select("id").single();
  await logActivity(supabase, user.id, "note_created", "note", data?.id, { title: "Nouvelle note" }, space);
  revalidatePath("/notes"); revalidatePath("/dashboard");
  redirect(`/notes/${data?.id}`);
}

export async function saveNote(id: string, d: { title: string; content: string; spaceId: string | null; favorite: boolean; tags: string[] }) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("notes").update({
    title: d.title.slice(0, 200), content: d.content.slice(0, 200000), space_id: d.spaceId || null, favorite: d.favorite,
  }).eq("id", id);
  if (error) return { ok: false };
  const names = Array.from(new Set(d.tags.map((t) => t.trim().toLowerCase().slice(0, 40)).filter(Boolean))).slice(0, 10);
  await supabase.from("note_tags").delete().eq("note_id", id);
  if (names.length) {
    await supabase.from("tags").upsert(names.map((name) => ({ user_id: user.id, name })), { onConflict: "user_id,name" });
    const { data: rows } = await supabase.from("tags").select("id,name").in("name", names);
    const links = (rows ?? []).map((t: { id: string }) => ({ user_id: user.id, note_id: id, tag_id: t.id }));
    if (links.length) await supabase.from("note_tags").insert(links);
  }
  return { ok: true };
}
export async function deleteNote(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("notes").delete().eq("id", str(fd, "id"));
  revalidatePath("/notes"); revalidatePath("/dashboard");
  redirect("/notes");
}
export async function addNoteLink(fd: FormData) {
  const { supabase, user } = await requireUser();
  const from = str(fd, "from"); const to = str(fd, "to");
  if (!to || to === from) return;
  await supabase.from("note_links").upsert({ user_id: user.id, from_note_id: from, to_note_id: to }, { onConflict: "from_note_id,to_note_id" });
  revalidatePath(`/notes/${from}`);
}
export async function removeNoteLink(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("note_links").delete().eq("id", str(fd, "id"));
  revalidatePath(`/notes/${str(fd, "from")}`);
}
export async function restoreVersion(fd: FormData) {
  const { supabase } = await requireUser();
  const noteId = str(fd, "note_id");
  const { data: v } = await supabase.from("note_versions").select("title,content").eq("id", str(fd, "version_id")).maybeSingle();
  if (v) await supabase.from("notes").update({ title: v.title ?? "", content: v.content ?? "" }).eq("id", noteId);
  redirect(`/notes/${noteId}?v=${Date.now()}`);
}
