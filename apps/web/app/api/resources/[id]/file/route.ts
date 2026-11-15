import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accessTokenFor } from "@/lib/google";

// Diffuse un fichier Drive de l'utilisateur (avec support des Range pour audio/vidéo/PDF).
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Non connecté", { status: 401 });
  const { data: r } = await supabase.from("resources").select("drive_file_id,mime_type,name").eq("id", params.id).maybeSingle();
  if (!r?.drive_file_id) return new NextResponse("Introuvable", { status: 404 });
  const t = await accessTokenFor(user.id);
  if (!t) return new NextResponse("Google Drive non connecté", { status: 409 });
  const headers: Record<string, string> = { Authorization: `Bearer ${t.token}` };
  const range = request.headers.get("range");
  if (range) headers.Range = range;
  const up = await fetch(`https://www.googleapis.com/drive/v3/files/${r.drive_file_id}?alt=media`, { headers });
  if (up.status === 404) {
    await supabase.from("resources").update({ drive_status: "missing" }).eq("id", params.id);
    return new NextResponse("Fichier supprimé dans Drive", { status: 404 });
  }
  if (!up.ok && up.status !== 206) return new NextResponse("Erreur Drive", { status: 502 });
  const h = new Headers();
  h.set("Content-Type", r.mime_type ?? "application/octet-stream");
  for (const k of ["content-length", "content-range", "accept-ranges"]) { const v = up.headers.get(k); if (v) h.set(k, v); }
  if (!h.has("accept-ranges")) h.set("accept-ranges", "bytes");
  h.set("Cache-Control", "private, max-age=300");
  if (request.nextUrl.searchParams.get("download")) h.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(r.name)}`);
  return new Response(up.body, { status: up.status, headers: h });
}
