import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  const admin = createAdmin();
  const { data } = await admin.from("google_connections").select("refresh_token_enc").eq("user_id", user.id).maybeSingle();
  if (data?.refresh_token_enc) {
    try {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: decrypt(data.refresh_token_enc) }),
      });
    } catch { /* révocation best effort */ }
  }
  await admin.from("google_connections").delete().eq("user_id", user.id);
  return NextResponse.redirect(new URL("/settings?google=off", request.url), { status: 303 });
}
