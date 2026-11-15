import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import { createFolder, exchangeCode, SCOPE } from "@/lib/google";

export async function GET(request: NextRequest) {
  const to = (q: string) => NextResponse.redirect(new URL(`/settings?google=${q}`, request.url));
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!code || !state || state !== request.cookies.get("g_state")?.value) return to("error");
  try {
    const t = await exchangeCode(code);
    if (!t.refresh_token) return to("norefresh");
    const admin = createAdmin();
    const { data: existing } = await admin.from("google_connections").select("drive_folder_id").eq("user_id", user.id).maybeSingle();
    const folderId = existing?.drive_folder_id ?? (await createFolder(t.access_token));
    const about = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)", { headers: { Authorization: `Bearer ${t.access_token}` } });
    const email = about.ok ? (await about.json())?.user?.emailAddress ?? null : null;
    await admin.from("google_connections").upsert({
      user_id: user.id, google_email: email, refresh_token_enc: encrypt(t.refresh_token), scopes: [SCOPE],
      drive_folder_id: folderId, connected_at: new Date().toISOString(), revoked_at: null,
    }, { onConflict: "user_id" });
    const res = to("ok");
    res.cookies.delete("g_state");
    return res;
  } catch {
    return to("error");
  }
}
