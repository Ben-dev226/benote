import { createAdmin } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

export const SCOPE = "https://www.googleapis.com/auth/drive.file";
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const googleConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.TOKEN_ENC_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function authUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: `${siteUrl()}/api/google/callback`, response_type: "code",
    scope: SCOPE, access_type: "offline", prompt: "consent", state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

async function tokenCall(params: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...params }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "token_error");
  return json as { access_token: string; refresh_token?: string };
}
export const exchangeCode = (code: string) =>
  tokenCall({ code, grant_type: "authorization_code", redirect_uri: `${siteUrl()}/api/google/callback` });

export async function accessTokenFor(userId: string) {
  const admin = createAdmin();
  const { data } = await admin.from("google_connections").select("refresh_token_enc,drive_folder_id,revoked_at").eq("user_id", userId).maybeSingle();
  if (!data || data.revoked_at || !data.refresh_token_enc) return null;
  try {
    const t = await tokenCall({ grant_type: "refresh_token", refresh_token: decrypt(data.refresh_token_enc) });
    return { token: t.access_token, folderId: (data.drive_folder_id as string | null) ?? null };
  } catch {
    await admin.from("google_connections").update({ revoked_at: new Date().toISOString() }).eq("user_id", userId);
    return null;
  }
}

export async function createFolder(token: string) {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "myNotebook", mimeType: "application/vnd.google-apps.folder" }),
  });
  const json = await res.json();
  return (json.id as string | undefined) ?? null;
}

export async function driveInfo(userId: string): Promise<{ status: "config" | "off" | "ok"; email: string | null }> {
  if (!googleConfigured()) return { status: "config", email: null };
  const { data } = await createAdmin().from("google_connections").select("revoked_at,google_email").eq("user_id", userId).maybeSingle();
  return data && !data.revoked_at ? { status: "ok", email: data.google_email ?? null } : { status: "off", email: null };
}
