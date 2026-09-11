"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none";
type ClassRow = { id: string; name: string; class_type: string; subject: string; location: string | null; status: string; duration_minutes: number; default_fee_amount: number };
export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", class_type: "GROUP", location: "", duration_minutes: 90, default_fee_amount: 0 });
  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
    if (!profile) return;
    setTenantId(profile.tenant_id);
    const { data } = await supabase.from('classes').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }) as { data: ClassRow[] | null };
    setClasses(data ?? []); setLoading(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const openAdd = () => { setEditingId(null); setForm({ name: "", subject: "", class_type: "GROUP", location: "", duration_minutes: 90, default_fee_amount: 0 }); setIsOpen(true); };
  const openEdit = (c: ClassRow) => { setEditingId(c.id); setForm({ name: c.name, subject: c.subject, class_type: c.class_type, location: c.location ?? "", duration_minutes: c.duration_minutes, default_fee_amount: Number(c.default_fee_amount) }); setIsOpen(true); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) return alert("Nama & mapel wajib.");
    if (!tenantId) return;
    if (editingId) {
      const { error } = await supabase.from('classes').update({ name: form.name, subject: form.subject, class_type: form.class_type, location: form.location || null, duration_minutes: Number(form.duration_minutes), default_fee_amount: Number(form.default_fee_amount) } as never).eq('id', editingId);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from('classes').insert({ tenant_id: tenantId, name: form.name, subject: form.subject, class_type: form.class_type, location: form.location || null, duration_minutes: Number(form.duration_minutes), default_fee_amount: Number(form.default_fee_amount) } as never);
      if (error) return alert(error.message);
    }
    setIsOpen(false); fetchData();
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kelas ini?")) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) return alert(error.message);
    setClasses(p => p.filter(c => c.id !== id));
  };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kelas</h1><p className="text-sm text-slate-500 mt-1">Kelola kelas individu / grup & tarif default.</p></div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2"><i className="ti ti-plus" />Buat Kelas</button>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["Nama","Tipe","Mapel","Durasi","Tarif","Lokasi",""].map(h=><th key={h} className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? Array.from({length:3}).map((_,i)=><tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td></tr>)
              : classes.length===0 ? <tr><td colSpan={7} className="py-20 text-center"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100"><i className="ti ti-category text-3xl text-slate-300" /></div><p className="text-sm text-slate-500">Belum ada kelas. Buat kelas pertama.</p></td></tr>
              : classes.map(c=>(
                <tr key={c.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{c.name}</td>
                  <td className="px-6 py-4"><span className={`text-[11px] font-bold px-2 py-1 rounded-full ${c.class_type==='GROUP'?'bg-brand-50 text-brand-700':'bg-slate-100 text-slate-600'}`}>{c.class_type}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.subject}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.duration_minutes} menit</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">Rp {Number(c.default_fee_amount).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.location ?? '-'}</td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100"><button onClick={()=>openEdit(c)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-brand-300"><i className="ti ti-pencil" /></button><button onClick={()=>handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-danger-500 flex items-center justify-center"><i className="ti ti-trash" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit Kelas" : "Buat Kelas"}</h3><button onClick={()=>setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="ti ti-x" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Nama Kelas</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inputClass} required /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Mapel</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className={inputClass} required /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Tipe</label><select value={form.class_type} onChange={e=>setForm({...form,class_type:e.target.value})} className={inputClass}><option value="GROUP">GROUP</option><option value="INDIVIDUAL">INDIVIDUAL</option></select></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Durasi (menit)</label><input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:Number(e.target.value)})} className={inputClass} min={15} /></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Tarif Default</label><input type="number" value={form.default_fee_amount} onChange={e=>setForm({...form,default_fee_amount:Number(e.target.value)})} className={inputClass} min={0} /></div>
              <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Lokasi</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className={inputClass} placeholder="Online / Ruang A" /></div>
              <div className="col-span-2 flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setIsOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600">Batal</button><button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
