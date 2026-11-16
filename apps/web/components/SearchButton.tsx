"use client";
import { Search } from "lucide-react";

export default function SearchButton({ compact }: { compact?: boolean }) {
  const open = () => window.dispatchEvent(new Event("open-palette"));
  if (compact) return <button className="btn-icon" onClick={open} aria-label="Rechercher"><Search size={18} /></button>;
  return <button className="searchbtn" onClick={open}><Search size={15} /><span>Rechercher</span><kbd>Ctrl K</kbd></button>;
}
