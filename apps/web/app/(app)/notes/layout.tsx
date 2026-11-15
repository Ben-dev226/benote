import { requireUser } from "@/lib/auth";
import NotesShell from "./NotesShell";

export default async function NotesLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireUser();
  const [notes, spaces, nt] = await Promise.all([
    supabase.from("notes").select("id,title,content,favorite,space_id,updated_at").order("favorite", { ascending: false }).order("updated_at", { ascending: false }).limit(300),
    supabase.from("learning_spaces").select("id,title").order("title"),
    supabase.from("note_tags").select("note_id,tags(name)"),
  ]);
  const tagMap: Record<string, string[]> = {};
  for (const r of (nt.data ?? []) as unknown as { note_id: string; tags: { name: string } | { name: string }[] | null }[]) {
    const t = Array.isArray(r.tags) ? r.tags[0] : r.tags;
    if (t) (tagMap[r.note_id] ??= []).push(t.name);
  }
  const list = ((notes.data ?? []) as { id: string; title: string; content: string; favorite: boolean; space_id: string | null; updated_at: string }[])
    .map((n) => ({ id: n.id, title: n.title, excerpt: n.content.slice(0, 120), favorite: n.favorite, spaceId: n.space_id, updatedAt: n.updated_at, tags: tagMap[n.id] ?? [] }));
  return <NotesShell notes={list} spaces={(spaces.data ?? []) as { id: string; title: string }[]}>{children}</NotesShell>;
}
