"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/lib/useDebounce";
import dayjs from "dayjs";
const PAGE_SIZE = 20;
type Log = { id: string; action: string; table_name: string; record_id: string | null; created_at: string; actor_id: string | null };
export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('audit_logs').select('*', { count: 'exact' });
    if (dq.trim()) query = query.or(`table_name.ilike.%${dq}%,action.ilike.%${dq}%`);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1) as { data: Log[] | null; count: number | null };
    setLogs(data ?? []); setTotal(count ?? 0); setLoading(false);
  }, [dq, page]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [dq]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1><p className="text-sm text-slate-500 mt-1">Jejak INSERT/UPDATE/DELETE students/fees/sessions.</p></div>
        <div className="relative w-full md:w-64"><i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari tabel/aksi..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-brand-500" /></div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["Waktu","Aksi","Tabel","Record","Actor"].map(h=><th key={h} className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={5} className="px-6 py-8"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td></tr>
              : logs.length===0 ? <tr><td colSpan={5} className="py-16 text-center"><i className="ti ti-history text-3xl text-slate-300" /><p className="text-sm text-slate-500 mt-2">Belum ada log atau migration belum dijalankan.</p></td></tr>
              : logs.map(l=>(
                <tr key={l.id} className="hover:bg-slate-50"><td className="px-6 py-3 text-sm text-slate-600">{dayjs(l.created_at).format('DD MMM YYYY HH:mm:ss')}</td><td className="px-6 py-3"><span className={`text-[11px] font-bold px-2 py-1 rounded-full ${l.action==='INSERT'?'bg-success-50 text-success-700':l.action==='DELETE'?'bg-danger-50 text-danger-700':'bg-warning-50 text-warning-700'}`}>{l.action}</span></td><td className="px-6 py-3 text-sm font-mono text-slate-700">{l.table_name}</td><td className="px-6 py-3 text-xs font-mono text-slate-500 truncate max-w-[160px]">{l.record_id ?? '-'}</td><td className="px-6 py-3 text-xs font-mono text-slate-400 truncate max-w-[120px]">{l.actor_id?.slice(0,8) ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between"><span className="text-xs text-slate-500">Total {total} · Hal {page}/{totalPages}</span><div className="flex gap-1"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-50"><i className="ti ti-chevron-left" /></button><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-50"><i className="ti ti-chevron-right" /></button></div></div>
      </div>
    </div>
  );
}
