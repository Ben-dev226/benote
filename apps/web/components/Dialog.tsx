"use client";
import { createContext, useContext, useEffect, useRef } from "react";
import { X } from "lucide-react";

const Ctx = createContext<{ close: () => void } | null>(null);
export const useDialog = () => useContext(Ctx);

export default function Dialog({ trigger, title, children, defaultOpen = false, className = "btn" }: {
  trigger: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (defaultOpen) ref.current?.showModal(); }, [defaultOpen]);
  const close = () => ref.current?.close();
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>{trigger}</button>
      <dialog ref={ref} className="dlg" onClick={(e) => { if (e.target === ref.current) close(); }}>
        <Ctx.Provider value={{ close }}>
          <div className="dlg-h"><h2>{title}</h2><button type="button" className="btn-icon" onClick={close} aria-label="Fermer"><X size={18} /></button></div>
          <div onSubmit={(e) => { if (!(e.target as HTMLElement).closest("[data-keep-open]")) setTimeout(close, 60); }}>{children}</div>
        </Ctx.Provider>
      </dialog>
    </>
  );
}
