export type Kind = "document" | "image" | "video" | "audio" | "link" | "other";
export const KIND_LABEL: Record<string, string> = { document: "Document", image: "Image", video: "Vidéo", audio: "Audio", link: "Lien", other: "Autre" };
export const KIND_ICON: Record<string, string> = { document: "📄", image: "🖼️", video: "🎬", audio: "🎵", link: "🔗", other: "📎" };

export function kindFromMime(mime: string): Kind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || mime === "text/plain" || mime.includes("wordprocessingml")) return "document";
  return "other";
}
const BLOCKED = /\.(exe|bat|cmd|sh|msi|apk|js|jar|scr|com|vbs|ps1)$/i;
export const isBlockedFile = (name: string) => BLOCKED.test(name);
export const MAX_UPLOAD = 500 * 1024 * 1024;

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      return m ? m[2] : null;
    }
  } catch { /* url invalide */ }
  return null;
}
export const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);
export function fmtSize(n?: number | null) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} Ko`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} Mo`;
  return `${(n / 1024 ** 3).toFixed(1)} Go`;
}
export function fmtTime(s: number) {
  const t = Math.max(0, Math.floor(s));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(sec).padStart(2, "0")}`;
}
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
export const fmtDateTime = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
export function str(fd: FormData, name: string, max = 500) {
  return String(fd.get(name) ?? "").trim().slice(0, max);
}
export const clean = (s: string) => s.replace(/[,()%*\\]/g, " ").trim();
