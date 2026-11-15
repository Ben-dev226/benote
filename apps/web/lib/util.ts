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

const PALETTE = ["#6d5dfc", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#fb923c", "#a78bfa", "#2dd4bf"];
export function colorFor(key: string | null | undefined) {
  if (!key) return "#8a90c0";
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export const KIND_COLOR: Record<string, string> = { document: "#f43f5e", image: "#38bdf8", video: "#ef4444", audio: "#a78bfa", link: "#6d8cff", other: "#9aa1d6" };
export function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "À l’instant";
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "Hier";
  return `Il y a ${Math.floor(s / 86400)} j`;
}
export function dayBucket(iso: string) {
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date(iso)) - day(new Date())) / 86400000);
  if (diff < 0) return "En retard";
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Demain";
  return "Plus tard";
}
