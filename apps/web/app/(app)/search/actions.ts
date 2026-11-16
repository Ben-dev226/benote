"use server";
import { requireUser } from "@/lib/auth";
import { clean } from "@/lib/util";

export type Hit = { id: string; type: "note" | "space" | "resource"; title: string; sub: string; href: string };

export async function searchAll(raw: string): Promise<Hit[]> {
  const q = clean(raw);
  if (q.length < 2) return [];
  const { supabase } = await requireUser();
  const [s, n, r] = await Promise.all([
    supabase.from("learning_spaces").select("id,title").ilike("title", `%${q}%`).limit(4),
    supabase.from("notes").select("id,title,content").or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(6),
    supabase.from("resources").select("id,name,kind").or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(6),
  ]);
  return [
    ...((s.data ?? []) as { id: string; title: string }[]).map((x) => ({ id: x.id, type: "space" as const, title: x.title, sub: "Apprentissage", href: `/spaces/${x.id}` })),
    ...((n.data ?? []) as { id: string; title: string; content: string }[]).map((x) => ({ id: x.id, type: "note" as const, title: x.title || "Sans titre", sub: x.content.slice(0, 70) || "Note", href: `/notes/${x.id}` })),
    ...((r.data ?? []) as { id: string; name: string; kind: string }[]).map((x) => ({ id: x.id, type: "resource" as const, title: x.name, sub: "Ressource", href: `/library/${x.id}` })),
  ];
}
