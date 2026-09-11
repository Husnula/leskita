"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
type SessionRow = { id: string; subject: string; start_at: string; student_id: string | null; students: { name: string } | null };
type AttendanceRow = { id: string; session_id: string; student_id: string; status: string; note: string | null };
export default function AttendancePage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchTenant = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
    if (profile) setTenantId(profile.tenant_id);
  }, []);
  useEffect(() => { fetchTenant(); }, [fetchTenant]);
  const fetchSessions = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const start = dayjs(date).startOf('day').toISOString();
    const end = dayjs(date).endOf('day').toISOString();
    const { data } = await supabase.from('sessions').select('id, subject, start_at, student_id, students(name)').eq('tenant_id', tenantId).gte('start_at', start).lte('start_at', end).order('start_at') as { data: SessionRow[] | null };
    setSessions(data ?? []); setLoading(false);
    if (data && data.length && !selected) setSelected(data[0].id);
  }, [tenantId, date, selected]);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  const fetchAttendance = useCallback(async () => {
    if (!selected || !tenantId) return;
    const { data } = await supabase.from('attendance').select('*').eq('tenant_id', tenantId).eq('session_id', selected) as { data: AttendanceRow[] | null };
    setRows(data ?? []);
  }, [selected, tenantId]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  const mark = async (studentId: string, status: string) => {
    if (!tenantId || !selected) return;
    const existing = rows.find(r => r.student_id === studentId);
    if (existing) {
      const { error } = await supabase.from('attendance').update({ status, billable: status !== 'ABSENT_FREE' } as never).eq('id', existing.id);
      if (error) return alert(error.message);
      setRows(prev => prev.map(r => r.id === existing.id ? { ...r, status } : r));
    } else {
      const { data, error } = await supabase.from('attendance').insert({ tenant_id: tenantId, session_id: selected, student_id: studentId, status, billable: status !== 'ABSENT_FREE' } as never).select() as { data: AttendanceRow[] | null; error: { message: string } | null };
      if (error) return alert(error.message);
      if (data) setRows(prev => [...prev, data[0]]);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Absensi</h1><p className="text-sm text-slate-500 mt-1">Tandai kehadiran per sesi.</p></div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-700 px-2">Sesi {dayjs(date).format('DD MMM YYYY')}</h3>
          {loading ? <p className="text-sm text-slate-500 px-2">Memuat...</p>
          : sessions.length===0 ? <p className="text-sm text-slate-500 px-2 py-8 text-center">Tidak ada sesi.</p>
          : sessions.map(s=>(
            <button key={s.id} onClick={()=>setSelected(s.id)} className={`text-left p-3 rounded-xl border flex justify-between items-center ${selected===s.id?'bg-brand-50 border-brand-200':'bg-white border-slate-100 hover:bg-slate-50'}`}>
              <div><div className="text-sm font-bold text-slate-800">{s.students?.name ?? '-'} </div><div className="text-xs text-slate-500">{s.subject} · {dayjs(s.start_at).format('HH:mm')}</div></div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100">{rows.filter(r=>r.session_id===s.id).length ? 'Ada data' : ''}</span>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
          {!selected ? <p className="text-sm text-slate-500 text-center py-12">Pilih sesi di kiri.</p>
          : (() => {
              const sess = sessions.find(s=>s.id===selected);
              if (!sess) return <p className="text-sm text-slate-500">Sesi tidak ditemukan.</p>;
              const sid = sess.student_id;
              if (!sid) return <p className="text-sm text-slate-500">Sesi ini tanpa siswa terikat. Hubungkan siswa di jadwal.</p>;
              const att = rows.find(r=>r.student_id===sid);
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">{sess.students?.name?.charAt(0) ?? '?'}</div><div><div className="font-bold text-slate-800">{sess.students?.name}</div><div className="text-xs text-slate-500">{sess.subject}</div></div><div className="ml-auto text-xs text-slate-500">{att ? `Status: ${att.status}` : 'Belum ditandai'}</div></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { v: 'PRESENT', label: 'Hadir', color: 'bg-success-50 text-success-700 border-success-200' },
                      { v: 'ABSENT_BILLABLE', label: 'Absen (Tagih)', color: 'bg-warning-50 text-warning-700 border-warning-200' },
                      { v: 'ABSENT_FREE', label: 'Absen (Gratis)', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                    ].map(b=>(
                      <button key={b.v} onClick={()=>mark(sid, b.v)} className={`px-4 py-3 rounded-xl border text-sm font-bold ${att?.status===b.v ? b.color : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{b.label}</button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">Billable otomatis: ABSENT_FREE = tidak ditagih.</p>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
