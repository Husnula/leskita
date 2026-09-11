"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none";
const areaClass = inputClass + " min-h-[80px] resize-y";
type ReportRow = { id: string; material: string; progress: string; homework: string | null; score: number | null; teacher_note: string | null; published_at: string | null; created_at: string | null; students: { name: string } | null; sessions: { start_at: string; subject: string } | null };
type SessionOpt = { id: string; student_id: string | null; subject: string; start_at: string; students: { name: string } | null };
export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [sessions, setSessions] = useState<SessionOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ session_id: "", material: "", progress: "", homework: "", score: "", teacher_note: "", published: false });
  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
    if (!profile) return;
    setTenantId(profile.tenant_id);
    const { data: rep } = await supabase.from('reports').select('*, students(name), sessions(start_at, subject)').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }) as { data: ReportRow[] | null };
    setReports(rep ?? []);
    const { data: sess } = await supabase.from('sessions').select('id, student_id, subject, start_at, students(name)').eq('tenant_id', profile.tenant_id).eq('status', 'DONE').order('start_at', { ascending: false }).limit(50) as { data: SessionOpt[] | null };
    setSessions(sess ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const openAdd = () => { setEditingId(null); setForm({ session_id: "", material: "", progress: "", homework: "", score: "", teacher_note: "", published: false }); setIsOpen(true); };
  const openEdit = (r: ReportRow & { session_id: string; student_id: string }) => {
    const sess = sessions.find(s=>s.id===r.session_id);
    setEditingId(r.id);
    setForm({ session_id: r.session_id, material: r.material, progress: r.progress, homework: r.homework ?? "", score: r.score != null ? String(r.score) : "", teacher_note: r.teacher_note ?? "", published: !!r.published_at });
    setIsOpen(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (!form.session_id || !form.material.trim() || !form.progress.trim()) return alert("Sesi, materi, dan progres wajib diisi.");
    const sess = sessions.find(s => s.id === form.session_id);
    if (!sess?.student_id) return alert("Sesi tanpa siswa.");
    try {
      const payload = { tenant_id: tenantId, session_id: form.session_id, student_id: sess.student_id, material: form.material, progress: form.progress, homework: form.homework || null, score: form.score ? Number(form.score) : null, teacher_note: form.teacher_note || null, published_at: form.published ? new Date().toISOString() : null } as never;
      if (editingId) {
        const { error } = await supabase.from('reports').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reports').insert(payload);
        if (error) throw error;
      }
      setIsOpen(false); fetchData();
    } catch (err: unknown) { alert((err as Error).message); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan?")) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) return alert(error.message);
    setReports(p=>p.filter(r=>r.id!==id));
  };
  const togglePublish = async (r: ReportRow) => {
    const { error } = await supabase.from('reports').update({ published_at: r.published_at ? null : new Date().toISOString() } as never).eq('id', r.id);
    if (error) return alert(error.message);
    setReports(prev=>prev.map(x=>x.id===r.id?{...x,published_at: x.published_at?null:new Date().toISOString()}:x));
  };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Belajar</h1><p className="text-sm text-slate-500 mt-1">Materi, progres, PR, nilai.</p></div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"><i className="ti ti-plus" />Buat Laporan</button>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["Siswa","Sesi","Materi","Progres","Nilai","Status",""].map(h=><th key={h} className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? Array.from({length:3}).map((_,i)=><tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td></tr>)
              : reports.length===0 ? <tr><td colSpan={7} className="py-20 text-center"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100"><i className="ti ti-file-analytics text-3xl text-slate-300" /></div><p className="text-sm text-slate-500">Belum ada laporan.</p></td></tr>
              : reports.map(r=>(
                <tr key={r.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{r.students?.name ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.sessions ? `${r.sessions.subject} · ${dayjs(r.sessions.start_at).format('DD MMM HH:mm')}` : '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate" title={r.material}>{r.material}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate" title={r.progress}>{r.progress}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{r.score ?? '-'}</td>
                  <td className="px-6 py-4"><button onClick={()=>togglePublish(r)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.published_at?'bg-success-50 text-success-700 border-success-200':'bg-slate-100 text-slate-600 border-slate-200'}`}>{r.published_at?'Published':'Draft'}</button></td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100"><button onClick={()=>openEdit(r as never)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><i className="ti ti-pencil" /></button><button onClick={()=>handleDelete(r.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-danger-500 flex items-center justify-center"><i className="ti ti-trash" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit Laporan" : "Buat Laporan"}</h3><button onClick={()=>setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="ti ti-x" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div className="md:col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Sesi DONE *</label><select value={form.session_id} onChange={e=>setForm({...form,session_id:e.target.value})} className={inputClass} required><option value="">-- Pilih Sesi --</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.students?.name ?? '-'} · {s.subject} · {dayjs(s.start_at).format('DD MMM YYYY HH:mm')}</option>)}</select><p className="text-[11px] text-slate-400">Hanya sesi DONE. Ubah status di Jadwal.</p></div>
              <div className="md:col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Materi *</label><textarea value={form.material} onChange={e=>setForm({...form,material:e.target.value})} className={areaClass} required /></div>
              <div className="md:col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Progres *</label><textarea value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})} className={areaClass} required /></div>
              <div className="md:col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">PR</label><textarea value={form.homework} onChange={e=>setForm({...form,homework:e.target.value})} className={areaClass} /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Nilai</label><input type="number" value={form.score} onChange={e=>setForm({...form,score:e.target.value})} className={inputClass} min={0} max={100} step={0.1} /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Catatan Guru</label><input value={form.teacher_note} onChange={e=>setForm({...form,teacher_note:e.target.value})} className={inputClass} /></div>
              <label className="md:col-span-2 flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})} className="w-5 h-5 accent-brand-600" /><span className="text-sm font-semibold text-slate-700">Publish (tampilkan ke wali)</span></label>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setIsOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600">Batal</button><button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
