"use client";
import { useEffect, useRef, useState } from "react";
import { saveProgress } from "../actions";
import QuickNote from "@/components/QuickNote";
import { fmtTime } from "@/lib/util";

export default function MediaPlayer({ id, kind, title, initialTime }: { id: string; kind: "audio" | "video"; title: string; initialTime: number }) {
  const ref = useRef<HTMLMediaElement | null>(null);
  const last = useRef(0);
  const [now, setNow] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const el = ref.current;
    if ("mediaSession" in navigator && el) {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "myNotebook" });
      navigator.mediaSession.setActionHandler("play", () => el.play());
      navigator.mediaSession.setActionHandler("pause", () => el.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => { el.currentTime -= 10; });
      navigator.mediaSession.setActionHandler("seekforward", () => { el.currentTime += 10; });
    }
  }, [title]);

  function persist(force = false) {
    const el = ref.current; if (!el) return;
    if (!force && Date.now() - last.current < 5000) return;
    last.current = Date.now();
    saveProgress(id, { seconds: el.currentTime, percent: el.duration ? (el.currentTime / el.duration) * 100 : undefined });
  }
  const common = {
    src: `/api/resources/${id}/file`, controls: true, preload: "metadata" as const,
    onLoadedMetadata: () => { if (ref.current && initialTime > 0) ref.current.currentTime = initialTime; },
    onTimeUpdate: () => { setNow(Math.floor(ref.current?.currentTime ?? 0)); persist(); },
    onPause: () => persist(true),
  };
  const skip = (d: number) => { if (ref.current) ref.current.currentTime += d; };
  return (
    <div className="stack">
      {kind === "video"
        ? <video ref={ref as React.RefObject<HTMLVideoElement>} className="media" {...common} />
        : <audio ref={ref as React.RefObject<HTMLAudioElement>} style={{ width: "100%" }} {...common} />}
      <div className="row toolbar">
        <button className="ghost" onClick={() => skip(-10)}>⏪ 10 s</button>
        <button className="ghost" onClick={() => skip(10)}>10 s ⏩</button>
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>{[0.75, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}</select>
        <span className="mu">{fmtTime(now)}</span>
      </div>
      <div className="card"><QuickNote resourceId={id} seconds={now} /></div>
    </div>
  );
}
