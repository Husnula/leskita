"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
import 'dayjs/locale/id';
dayjs.locale('id');
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400";
function FormField({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return <div className={`flex flex-col gap-2 ${span2 ? 'col-span-2' : ''}`}><label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-danger-500 ml-1">*</span>}</label>{children}</div>;
}
type SessionRow = { id: string; start_at: string; duration_minutes: number; subject: string; location: string | null; status: string; student_id: string | null; students: { name: string } | null };
type StudentOpt = { id: string; name: string; subject: string | null };
export default function SchedulePage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ student_id: "", start_time: "14:00", duration_minutes: 90, subject: "", location: "" });
  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
      if (profile) {
        setTenantId(profile.tenant_id);
        const { data: studentsData } = await supabase.from('students').select('id, name, subject').eq('tenant_id', profile.tenant_id).eq('status', 'ACTIVE');
        if (studentsData) setStudents(studentsData as StudentOpt[]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const fetchSessions = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const startOfDay = selectedDate.startOf('day').toISOString();
    const endOfDay = selectedDate.endOf('day').toISOString();
    const { data } = await supabase.from('sessions').select('*, students(name)').eq('tenant_id', tenantId).gte('start_at', startOfDay).lte('start_at', endOfDay).order('start_at') as { data: SessionRow[] | null };
    setSessions(data ?? []);
    setLoading(false);
  }, [tenantId, selectedDate]);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'student_id') {
      const st = students.find(s => s.id === value);
      setFormData(prev => ({ ...prev, student_id: value, subject: st?.subject ?? prev.subject }));
    } else setFormData(prev => ({ ...prev, [name]: value }));
  };
  const hasOverlap = (newStart: Date, newEnd: Date) => {
    return sessions.some(s => {
      if (editingId && s.id === editingId) return false;
      const sStart = new Date(s.start_at);
      const sEnd = new Date(sStart.getTime() + s.duration_minutes * 60000);
      return newStart < sEnd && newEnd > sStart;
    });
  };
  const openAdd = () => { setEditingId(null); setFormData({ student_id: "", start_time: "14:00", duration_minutes: 90, subject: "", location: "" }); setIsModalOpen(true); };
  const openEdit = (s: SessionRow) => {
    setEditingId(s.id);
    const d = dayjs(s.start_at);
    setFormData({ student_id: s.student_id ?? "", subject: s.subject, start_time: d.format('HH:mm'), duration_minutes: s.duration_minutes, location: s.location ?? "" });
    setIsModalOpen(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return alert("Tenant tidak ditemukan.");
    if (!formData.student_id) return alert("Pilih siswa.");
    const startDateTime = selectedDate.format('YYYY-MM-DD') + 'T' + formData.start_time + ':00';
    const newStart = new Date(startDateTime);
    const newEnd = new Date(newStart.getTime() + Number(formData.duration_minutes) * 60000);
    if (hasOverlap(newStart, newEnd)) return alert("Jadwal bentrok dengan sesi lain di hari yang sama.");
    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('sessions').update({ student_id: formData.student_id, start_at: newStart.toISOString(), duration_minutes: Number(formData.duration_minutes), subject: formData.subject, location: formData.location || null } as never).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sessions').insert({ tenant_id: tenantId, student_id: formData.student_id, start_at: newStart.toISOString(), duration_minutes: Number(formData.duration_minutes), subject: formData.subject, location: formData.location || null, status: 'SCHEDULED' } as never);
        if (error) throw error;
      }
      setIsModalOpen(false); setEditingId(null); fetchSessions();
    } catch (err: unknown) { alert("Gagal: " + (err as Error).message); } finally { setIsSubmitting(false); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus sesi ini?")) return;
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) return alert(error.message);
    setSessions(prev => prev.filter(s => s.id !== id));
  };
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('sessions').update({ status } as never).eq('id', id);
    if (error) return alert(error.message);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.startOf('month').day();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const calendarDays = Array.from({ length: 42 }).map((_, i) => {
    if (i < startOffset) return null;
    if (i >= startOffset + daysInMonth) return null;
    return i - startOffset + 1;
  });
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jadwal Sesi Les</h1><p className="text-sm text-slate-500 mt-1">Atur jadwal pertemuan harian.</p></div>
        <button onClick={openAdd} className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><i className="ti ti-calendar-plus text-lg" />Buat Sesi Baru</button>
      </div>
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="xl:w-80 shrink-0 bg-white rounded-3xl border border-slate-100 shadow-sm h-fit p-6">
          <div className="flex justify-between items-center mb-6"><h4 className="text-base font-bold text-slate-800 capitalize">{currentDate.format('MMMM YYYY')}</h4><div className="flex gap-2"><button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg"><i className="ti ti-chevron-left" /></button><button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg"><i className="ti ti-chevron-right" /></button></div></div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {['S','S','R','K','J','S','M'].map((d,i)=><div key={i} className="text-xs font-bold text-slate-400 pb-2">{d}</div>)}
            {calendarDays.map((day,i)=>{
              if (day===null) return <div key={i} className="aspect-square" />;
              const isSelected = selectedDate.date()===day && selectedDate.month()===currentDate.month();
              const isToday = dayjs().date()===day && dayjs().month()===currentDate.month() && dayjs().year()===currentDate.year();
              return <div key={i} onClick={()=>setSelectedDate(currentDate.date(day))} className={`aspect-square flex items-center justify-center rounded-full text-sm font-semibold cursor-pointer mx-1 ${isSelected ? 'bg-brand-600 text-white shadow-md' : isToday ? 'border-2 border-brand-500 text-brand-600' : 'hover:bg-slate-100 text-slate-700'}`}>{day}</div>;
            })}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-brand-600 uppercase">{selectedDate.format('MMM')}</span><span className="text-sm font-black text-slate-800">{selectedDate.format('DD')}</span></div>
            <div><h3 className="text-base font-bold text-slate-800">Jadwal Harian</h3><p className="text-xs text-slate-500">{selectedDate.format('dddd, D MMMM YYYY')}</p></div>
          </div>
          <div className="p-6 flex flex-col gap-4 flex-1">
            {loading ? <div className="flex flex-col items-center justify-center min-h-[300px] gap-3"><i className="ti ti-loader-2 animate-spin text-3xl text-brand-500" /><p className="text-sm text-slate-500">Memuat...</p></div>
            : sessions.length===0 ? <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] text-center"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100"><i className="ti ti-calendar-off text-3xl text-slate-300" /></div><h3 className="text-lg font-bold text-slate-700">Hari yang Kosong</h3><p className="text-slate-500 text-sm max-w-[250px]">Tidak ada jadwal untuk hari ini.</p></div>
            : <div className="relative"><div className="absolute left-[39px] top-4 bottom-4 w-px bg-slate-100" /><div className="flex flex-col gap-6 relative">
              {sessions.map(session=>{
                const startTime = dayjs(session.start_at);
                const endTime = startTime.add(session.duration_minutes, 'minute');
                return <div key={session.id} className="flex gap-4 group">
                  <div className="flex flex-col items-end w-[80px] shrink-0 pt-1 relative bg-white z-10 pr-4"><div className="absolute right-0 top-2 translate-x-[5px] w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white ring-4 ring-brand-50" /><div className="text-sm font-bold text-slate-800">{startTime.format('HH:mm')}</div><span className="text-[11px] text-slate-400">{endTime.format('HH:mm')}</span></div>
                  <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm">{session.students?.name?.charAt(0).toUpperCase() || '?'}</div><div><div className="text-sm font-bold text-slate-800">{session.students?.name || '-'}</div><div className="text-[12px] text-slate-500 flex items-center gap-1"><i className="ti ti-book text-brand-500" /> {session.subject}{session.location ? ` · ${session.location}` : ''}</div></div></div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select value={session.status} onChange={e=>updateStatus(session.id, e.target.value)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${session.status==='DONE'?'bg-success-50 text-success-700 border-success-200':session.status==='CANCELLED'?'bg-slate-100 text-slate-600 border-slate-200':'bg-brand-50 text-brand-700 border-brand-200'}`}>
                        <option value="SCHEDULED">SCHEDULED</option><option value="DONE">DONE</option><option value="CANCELLED">CANCELLED</option>
                      </select>
                      <div className="flex gap-1.5 ml-auto sm:ml-0"><button onClick={()=>openEdit(session)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"><i className="ti ti-pencil" /></button><button onClick={()=>handleDelete(session.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-50 text-danger-500 hover:bg-danger-100 border border-danger-200"><i className="ti ti-trash" /></button></div>
                    </div>
                  </div>
                </div>;
              })}
            </div></div>}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><div><h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit Sesi" : "Buat Sesi Baru"}</h3><p className="text-xs text-slate-500">{selectedDate.format('dddd, D MMMM YYYY')}</p></div><button onClick={()=>setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"><i className="ti ti-x text-xl" /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-5 p-6">
                <FormField label="Pilih Siswa" required span2><select name="student_id" value={formData.student_id} onChange={handleInputChange} className={inputClass} required><option value="">-- Pilih Siswa --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.subject})</option>)}</select></FormField>
                <FormField label="Mata Pelajaran" required span2><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className={inputClass} required /></FormField>
                <FormField label="Waktu Mulai" required><input type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} className={inputClass} required /></FormField>
                <FormField label="Durasi (Menit)" required><input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} min={15} step={15} className={inputClass} required /></FormField>
                <FormField label="Lokasi" span2><input type="text" name="location" value={formData.location} onChange={handleInputChange} className={inputClass} placeholder="Ruang A / Online" /></FormField>
              </div>
              <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600">Batal</button><button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white flex items-center gap-2 disabled:opacity-50">{isSubmitting ? <><i className="ti ti-loader-2 animate-spin" /> Menyimpan...</> : <><i className="ti ti-calendar-plus" /> {editingId ? "Update" : "Simpan"} Sesi</>}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
