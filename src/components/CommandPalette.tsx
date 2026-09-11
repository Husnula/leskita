"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
export type CommandItem = { label: string; href: string; keywords?: string; icon?: string };
const STATIC_ITEMS: CommandItem[] = [
  { label: "Home", href: "/dashboard", icon: "ti-layout-dashboard" },
  { label: "Siswa", href: "/dashboard/students", icon: "ti-users" },
  { label: "Kelas", href: "/dashboard/classes", icon: "ti-category" },
  { label: "Jadwal", href: "/dashboard/schedule", icon: "ti-calendar" },
  { label: "Absensi", href: "/dashboard/attendance", icon: "ti-clipboard-check" },
  { label: "Laporan", href: "/dashboard/reports", icon: "ti-file-analytics" },
  { label: "Tagihan", href: "/dashboard/fees", icon: "ti-file-invoice" },
  { label: "Pengaturan", href: "/dashboard/settings", icon: "ti-settings" },
  { label: "Parent Portal", href: "/parent", icon: "ti-users" },
  { label: "Admin Guru", href: "/dashboard/admin/teachers", icon: "ti-chalkboard" },
  { label: "Admin Paket", href: "/dashboard/admin/plans", icon: "ti-package" },
];
export function CommandPalette({ dynamicItems = [], open, onClose }: { dynamicItems?: CommandItem[]; open?: boolean; onClose?: () => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const isControlled = open !== undefined;
  const visible = isControlled ? open! : internalOpen;
  const setVisible = isControlled ? (v: boolean) => { if (!v) onClose?.(); } : setInternalOpen;
  useEffect(() => {
    if (isControlled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setInternalOpen(v=>!v); }
      if (e.key === "Escape") setInternalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isControlled]);
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setVisible(false); };
    if (visible) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [visible]);
  const items = useMemo(() => {
    const all = [...STATIC_ITEMS, ...dynamicItems];
    if (!q.trim()) return all;
    const low = q.toLowerCase();
    return all.filter(i => i.label.toLowerCase().includes(low) || i.keywords?.toLowerCase().includes(low) || i.href.toLowerCase().includes(low));
  }, [q, dynamicItems]);
  const go = (href: string) => { setVisible(false); setQ(""); if (!isControlled) setInternalOpen(false); else onClose?.(); router.push(href); };
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[20vh] p-4" onClick={()=>setVisible(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <i className="ti ti-search text-slate-400 text-lg" />
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari halaman atau nama siswa..." className="flex-1 outline-none text-sm text-slate-800 placeholder:text-slate-400" />
          <kbd className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50">ESC</kbd>
        </div>
        <div className="max-h-[40vh] overflow-y-auto p-2">
          {items.length===0 ? <p className="text-sm text-slate-500 text-center py-8">Tidak ada hasil.</p>
          : items.slice(0,20).map(it=>(
            <button key={it.href + it.label} onClick={()=>go(it.href)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-sm">
              <i className={`ti ${it.icon ?? 'ti-link'} text-slate-400`} /> <span className="font-semibold text-slate-800">{it.label}</span> <span className="ml-auto text-xs text-slate-400 truncate max-w-[40%]">{it.href}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">Ctrl+K / Cmd+K untuk buka</div>
      </div>
    </div>
  );
}
