"use client";
import { useState } from "react";
import { lookupByParentEmail } from "@/app/actions/parent";
import dayjs from "dayjs";
import { formatRupiah } from "@/lib/format";
export default function ParentPortal() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res: any = await lookupByParentEmail(email);
    setResult(res);
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold">L</div><span className="text-xl font-bold text-slate-900">LesKita</span><span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">Parent Portal</span></div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cek tagihan & laporan anak</h1>
          <p className="text-sm text-slate-500 mt-1">Masukkan email wali yang terdaftar di data siswa.</p>
          <form onSubmit={handleLookup} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="wali@email.com" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none" />
            <button type="submit" disabled={loading} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-search" />}Cari</button>
          </form>
          {result && !result.success && <p className="text-sm text-danger-600 font-medium mt-4 bg-danger-50 border border-danger-200 rounded-xl p-3">{result.message}</p>}
        </div>
        {result && result.success && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800">Siswa</h2>
              <div className="mt-4 grid gap-3">
                {(result.students as any[]).map((s: any)=>(
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div><div className="font-bold text-slate-800">{s.name}</div><div className="text-xs text-slate-500">{s.subject}{s.grade ? ` · ${s.grade}` : ''} · {s.tenants.workspace_name}</div></div><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.status==='ACTIVE'?'bg-success-50 text-success-700':'bg-slate-100 text-slate-600'}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><i className="ti ti-file-invoice text-brand-600" />Tagihan</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead><tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400"><th className="py-2">Periode</th><th className="py-2">Nominal</th><th className="py-2">Jatuh Tempo</th><th className="py-2">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(result.fees as any[]).length===0 ? <tr><td colSpan={4} className="py-8 text-center text-sm text-slate-500">Belum ada tagihan.</td></tr>
                    : (result.fees as any[]).map((f: any)=>(
                      <tr key={f.id}><td className="py-3 text-sm font-medium text-slate-700">{f.period}</td><td className="py-3 text-sm font-bold text-slate-800">{formatRupiah(f.amount)}</td><td className="py-3 text-sm text-slate-600">{dayjs(f.due_date).format('DD MMM YYYY')}</td><td className="py-3"><span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${f.status==='PAID'?'bg-success-50 text-success-700 border-success-200':'bg-danger-50 text-danger-700 border-danger-200'}`}>{f.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><i className="ti ti-file-analytics text-brand-600" />Laporan terbaru</h3>
              <div className="mt-4 flex flex-col gap-3">
                {(result.reports as any[]).length===0 ? <p className="text-sm text-slate-500 text-center py-6">Belum ada laporan publish.</p>
                : (result.reports as any[]).map((r: any)=>(
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="text-sm font-bold text-slate-800">{r.material}</div><div className="text-sm text-slate-600 mt-1">{r.progress}</div>{r.score != null && <div className="text-xs font-bold text-brand-600 mt-2">Nilai: {r.score}</div>}<div className="text-[11px] text-slate-400 mt-2">{dayjs(r.published_at).format('DD MMM YYYY')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><i className="ti ti-calendar text-brand-600" />Jadwal 7 hari</h3>
              <div className="mt-4 flex flex-col gap-2">
                {(result.sessions as any[]).length===0 ? <p className="text-sm text-slate-500 text-center py-6">Tidak ada sesi minggu ini.</p>
                : (result.sessions as any[]).map((s: any)=>(
                  <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100"><span className="text-sm font-semibold text-slate-800">{s.subject} · {dayjs(s.start_at).format('ddd, DD MMM HH:mm')}</span><span className={`text-[11px] font-bold px-2 py-1 rounded-full ${s.status==='DONE'?'bg-success-50 text-success-700':'bg-brand-50 text-brand-700'}`}>{s.status}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}
        <p className="text-center text-[11px] text-slate-400">Butuh bantuan? Hubungi guru via WA yang tertera di tagihan.</p>
      </div>
    </div>
  );
}
