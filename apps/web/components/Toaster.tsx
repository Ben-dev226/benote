"use client";
import { useEffect, useState } from "react";
import { Check, AlertCircle } from "lucide-react";

type T = { id: number; msg: string; kind: "ok" | "err" };

export default function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ msg: string; kind: "ok" | "err" }>).detail;
      const id = Date.now() + Math.random();
      setItems((c) => [...c, { id, ...d }]);
      setTimeout(() => setItems((c) => c.filter((x) => x.id !== id)), 3400);
    };
    window.addEventListener("toast", h);
    return () => window.removeEventListener("toast", h);
  }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.kind === "ok" ? <Check size={16} /> : <AlertCircle size={16} />}{t.msg}</div>)}
    </div>
  );
}
