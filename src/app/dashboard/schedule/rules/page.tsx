"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 outline-none";
const DAYS = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
type Rule = { id: string; subject: string; day_of_week: number; start_time: string; duration_minutes: number; location: string | null; active: boolean; student_id: string | null; students: { name: string } | null };
type StudentOpt = { id: string; name: string; subject: string | null };
export default function ScheduleRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", subject: "", day_of_week: 1, start_time: "14:00", duration_minutes: 90, location: "" });
  const [generating, setGenerating] = useState(false);
  const fetchAll = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
    if (!profile) return;
    setTenantId(profile.tenant_id);
    const { data: studs } = await supabase.from('students').select('id, name, subject').eq('tenant_id', profile.tenant_id).eq('status','ACTIVE') as { data: StudentOpt[] | null };
    setStudents(studs ?? []);
    const { data: r } = await supabase.from('schedule_rules').select('*, students(name)').eq('tenant_id', profile.tenant_id).order('day_of_week') as { data: Rule[] | null };
    setRules(r ?? []); setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (!form.subject.trim()) return alert("Mapel wajib.");
    const { error } = await supabase.from('schedule_rules').insert({ tenant_id: tenantId, student_id: form.student_id || null, subject: form.subject, day_of_week: Number(form.day_of_week), start_time: form.start_time, duration_minutes: Number(form.duration_minutes), location: form.location || null } as never);
    if (error) return alert(error.message);
    setIsOpen(false); fetchAll();
  };
  const toggleActive = async (r: Rule) => {
    const { error } = await supabase.from('schedule_rules').update({ active: !r.active } as never).eq('id', r.id);
    if (error) return alert(error.message);
    setRules(prev=>prev.map(x=>x.id===r.id?{...x,active:!r.active}:x));
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rule?")) return;
    const { error } = await supabase.from('schedule_rules').delete().eq('id', id);
    if (error) return alert(error.message);
    setRules(p=>p.filter(x=>x.id!==id));
  };
  const generateWeek = async () => {
    if (!tenantId) return;
    if (rules.filter(r=>r.active).length===0) return alert("Tidak ada rule aktif.");
    setGenerating(true);
    try {
      const monday = dayjs().startOf('week').add(1,'day');
      const payload: { tenant_id: string; student_id: string | null; subject: string; start_at: string; duration_minutes: number; location: string | null; status: string }[] = [];
      for (let d=0; d<7; d++) {
        const date = monday.add(d,'day');
        const dow = date.day();
        for (const r of rules.filter(x=>x.active && x.day_of_week===dow)) {
          const [hh,mm] = r.start_time.split(":").map(Number);
          const start = date.hour(hh).minute(mm).second(0).millisecond(0);
          const iso = start.toISOString();
          payload.push({ tenant_id: tenantId, student_id: r.student_id, subject: r.subject, start_at: iso, duration_minutes: r.duration_minutes, location: r.location, status: 'SCHEDULED' });
        }
      }
      if (payload.length===0) return alert("Tidak ada rule untuk minggu ini.");
      const { error } = await supabase.from('sessions').insert(payload as never);
      if (error) throw error;
      alert(`Berhasil generate ${payload.length} sesi minggu ini. Cek Jadwal.`);
    } catch (err: unknown) { alert((err as Error).message); } finally { setGenerating(false); }
  };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jadwal Rutin</h1><p className="text-sm text-slate-500 mt-1">Rule mingguan → generate sesi otomatis.</p></div>
        <div className="flex gap-3"><button onClick={generateWeek} disabled={generating} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"><i className={`ti ${generating?'ti-loader-2 animate-spin':'ti-calendar-plus'}`} />Generate Minggu Ini</button><button onClick={()=>setIsOpen(true)} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"><i className="ti ti-plus" />Tambah Rule</button></div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["Hari","Jam","Mapel","Siswa","Lokasi","Aktif",""].map(h=><th key={h} className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={7} className="px-6 py-8"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td></tr>
              : rules.length===0 ? <tr><td colSpan={7} className="py-20 text-center"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100"><i className="ti ti-repeat text-3xl text-slate-300" /></div><p className="text-sm text-slate-500">Belum ada rule. Atur jadwal tetap mingguan.</p></td></tr>
              : rules.map(r=>(
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{DAYS[r.day_of_week]}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.start_time} · {r.duration_minutes}m</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.subject}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.students?.name ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.location ?? '-'}</td>
                  <td className="px-6 py-4"><button onClick={()=>toggleActive(r)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.active?'bg-success-50 text-success-700 border-success-200':'bg-slate-100 text-slate-600 border-slate-200'}`}>{r.active?'Aktif':'Nonaktif'}</button></td>
                  <td className="px-6 py-4 text-right"><button onClick={()=>handleDelete(r.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-danger-500 flex items-center justify-center"><i className="ti ti-trash" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Tambah Rule Rutin</h3><button onClick={()=>setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="ti ti-x" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Siswa (opsional)</label><select value={form.student_id} onChange={e=>{ const v=e.target.value; const st=students.find(s=>s.id===v); setForm({...form,student_id:v, subject: st?.subject ?? form.subject}); }} className={inputClass}><option value="">-- Tanpa siswa spesifik --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.subject})</option>)}</select></div>
              <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Mapel *</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className={inputClass} required /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Hari *</label><select value={form.day_of_week} onChange={e=>setForm({...form,day_of_week:Number(e.target.value)})} className={inputClass}>{DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}</select></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Jam *</label><input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} className={inputClass} required /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Durasi (menit)</label><input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:Number(e.target.value)})} className={inputClass} min={15} /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Lokasi</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className={inputClass} placeholder="Online / Ruang A" /></div>
              <div className="col-span-2 flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setIsOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600">Batal</button><button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white">Simpan Rule</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
