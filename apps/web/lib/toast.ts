export function toast(msg: string, kind: "ok" | "err" = "ok") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("toast", { detail: { msg, kind } }));
}
