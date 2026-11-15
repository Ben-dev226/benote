"use client";
import { useCallback, useEffect, useState } from "react";
import { getDueReminders, toggleReminder } from "@/app/(app)/reminders/actions";

type R = { id: string; title: string; remind_at: string };

export default function ReminderWatcher() {
  const [due, setDue] = useState<R[]>([]);
  const [perm, setPerm] = useState<string>("granted");

  const check = useCallback(async () => {
    const list = await getDueReminders().catch(() => [] as R[]);
    setDue(list);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const seen: string[] = JSON.parse(sessionStorage.getItem("seen_rem") ?? "[]");
      list.filter((r) => !seen.includes(r.id)).forEach((r) => new Notification("myNotebook — Rappel", { body: r.title }));
      sessionStorage.setItem("seen_rem", JSON.stringify(list.map((r) => r.id)));
    }
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [check]);

  if (!due.length) return null;
  return (
    <div className="banner">
      <b>🔔 Rappels</b>
      {due.map((r) => (
        <div key={r.id} className="row">
          <span style={{ flex: 1 }}>{r.title}</span>
          <button className="ghost" onClick={async () => { await toggleReminder(r.id); check(); }}>Fait</button>
        </div>
      ))}
      {perm === "default" && (
        <button className="ghost" onClick={async () => setPerm(await Notification.requestPermission())}>Activer les notifications du navigateur</button>
      )}
    </div>
  );
}
