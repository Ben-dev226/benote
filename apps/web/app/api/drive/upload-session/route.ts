import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accessTokenFor, siteUrl } from "@/lib/google";
import { isBlockedFile, MAX_UPLOAD } from "@/lib/util";

// Ouvre une session d'envoi : le navigateur envoie ensuite le fichier DIRECTEMENT à Google (rien ne passe par Vercel).
export async function POST(request: NextRequest) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const b = await request.json().catch(() => null) as { name?: string; mimeType?: string; size?: number } | null;
  if (!b?.name || typeof b.size !== "number") return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  if (isBlockedFile(b.name)) return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  if (b.size > MAX_UPLOAD) return NextResponse.json({ error: "Fichier trop volumineux (500 Mo max)" }, { status: 400 });
  const t = await accessTokenFor(user.id);
  if (!t) return NextResponse.json({ error: "Google Drive non connecté" }, { status: 409 });
  const mime = b.mimeType || "application/octet-stream";
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${t.token}`, "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mime, "X-Upload-Content-Length": String(b.size),
      Origin: request.headers.get("origin") ?? siteUrl(),
    },
    body: JSON.stringify({ name: b.name.slice(0, 200), ...(t.folderId ? { parents: [t.folderId] } : {}) }),
  });
  const uploadUrl = res.headers.get("location");
  if (!res.ok || !uploadUrl) return NextResponse.json({ error: "Drive a refusé l’envoi (quota ou droits)" }, { status: 502 });
  return NextResponse.json({ uploadUrl });
}
