"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { accessTokenFor } from "@/lib/google";
import { isBlockedFile, isHttpUrl, kindFromMime, str, youtubeId, fmtTime } from "@/lib/util";

const refresh = () => { revalidatePath("/library"); revalidatePath("/dashboard"); };

export async function addLink(fd: FormData) {
  const { supabase, user } = await requireUser();
  const url = str(fd, "url", 2000); const name = str(fd, "name", 200) || url;
  if (!isHttpUrl(url)) return;
  const space = str(fd, "space_id") || null;
  const { data } = await supabase.from("resources").insert({
    user_id: user.id, space_id: space, kind: youtubeId(url) ? "video" : "link", name, url, description: str(fd, "description"),
  }).select("id").single();
  await logActivity(supabase, user.id, "resource_added", "resource", data?.id, { title: name }, space);
  refresh();
}

export async function registerDriveFile(input: { fileId: string; spaceId: string | null; description?: string }) {
  const { supabase, user } = await requireUser();
  const t = await accessTokenFor(user.id);
  if (!t) return { ok: false, error: "Google Drive non connecté" };
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.fileId)}?fields=id,name,mimeType,size`, {
    headers: { Authorization: `Bearer ${t.token}` },
  });
  if (!res.ok) return { ok: false, error: "Fichier introuvable dans Drive" };
  const f = await res.json();
  if (isBlockedFile(f.name)) return { ok: false, error: "Type de fichier non autorisé" };
  const { data, error } = await supabase.from("resources").insert({
    user_id: user.id, space_id: input.spaceId || null, kind: kindFromMime(f.mimeType), name: f.name, drive_file_id: f.id,
    mime_type: f.mimeType, size_bytes: f.size ? Number(f.size) : null, description: (input.description ?? "").slice(0, 500),
  }).select("id").single();
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, user.id, "resource_added", "resource", data?.id, { title: f.name }, input.spaceId);
  refresh();
  return { ok: true };
}

export async function updateResource(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  await supabase.from("resources").update({
    name: str(fd, "name", 200) || "Sans titre", description: str(fd, "description"), space_id: str(fd, "space_id") || null,
  }).eq("id", id);
  refresh(); revalidatePath(`/library/${id}`);
}
export async function deleteResource(fd: FormData) {
  const { supabase, user } = await requireUser();
  const id = str(fd, "id");
  const { data } = await supabase.from("resources").select("drive_file_id").eq("id", id).maybeSingle();
  if (data?.drive_file_id) {
    const t = await accessTokenFor(user.id);
    if (t) await fetch(`https://www.googleapis.com/drive/v3/files/${data.drive_file_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t.token}` } }).catch(() => null);
  }
  await supabase.from("resources").delete().eq("id", id);
  refresh();
  redirect("/library");
}

export async function saveProgress(resourceId: string, p: { page?: number; seconds?: number; percent?: number }) {
  const { supabase, user } = await requireUser();
  const { data: prev } = await supabase.from("resource_progress").select("resource_id").eq("resource_id", resourceId).maybeSingle();
  await supabase.from("resource_progress").upsert({
    user_id: user.id, resource_id: resourceId, last_page: p.page ?? null, last_seconds: p.seconds ?? null,
    percent: p.percent === undefined ? null : Math.min(100, Math.max(0, Math.round(p.percent))), updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,resource_id" });
  if (!prev) {
    const { data: r } = await supabase.from("resources").select("name,space_id").eq("id", resourceId).maybeSingle();
    await logActivity(supabase, user.id, "resource_read", "resource", resourceId, { title: r?.name ?? "" }, r?.space_id);
  }
}

export async function addBookmark(resourceId: string, page: number) {
  const { supabase, user } = await requireUser();
  await supabase.from("annotations").insert({ user_id: user.id, resource_id: resourceId, page, content: `Page ${page}`, data: { type: "bookmark" } });
  revalidatePath(`/library/${resourceId}`);
}
export async function deleteAnnotation(fd: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("annotations").delete().eq("id", str(fd, "id"));
  revalidatePath(`/library/${str(fd, "resource_id")}`);
}

export async function createLinkedNote(resourceId: string, d: { text: string; page?: number; seconds?: number }) {
  const { supabase, user } = await requireUser();
  const { data: r } = await supabase.from("resources").select("name,space_id").eq("id", resourceId).maybeSingle();
  if (!r || !d.text.trim()) return { ok: false };
  const where = d.page ? ` (p. ${d.page})` : d.seconds !== undefined ? ` (${fmtTime(d.seconds)})` : "";
  const { data: note } = await supabase.from("notes").insert({
    user_id: user.id, space_id: r.space_id, title: `Note — ${r.name}${where}`.slice(0, 200), content: d.text.slice(0, 20000),
  }).select("id").single();
  if (!note) return { ok: false };
  await supabase.from("resource_links").insert({ user_id: user.id, note_id: note.id, resource_id: resourceId, page: d.page ?? null, timestamp_s: d.seconds ?? null });
  await logActivity(supabase, user.id, "note_created", "note", note.id, { title: `Note — ${r.name}` }, r.space_id);
  revalidatePath(`/library/${resourceId}`); revalidatePath("/notes"); revalidatePath("/dashboard");
  return { ok: true };
}
