"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400";
type Plan = { id: string; name: string; monthly_price: number; student_limit: number; features: { whatsapp?: boolean; branding?: boolean } | null };
export default function AdminPlans() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', monthly_price: 0, student_limit: 10, features: { whatsapp: false, branding: false } });
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*').order('monthly_price', { ascending: true });
    if (data) setPlans(data as Plan[]);
    setLoading(false);
  }, []);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  const openAdd = () => { setEditingId(null); setFormData({ name: '', monthly_price: 0, student_limit: 10, features: { whatsapp: false, branding: false } }); setIsModalOpen(true); };
  const openEdit = (p: Plan) => { setEditingId(p.id); setFormData({ name: p.name, monthly_price: Number(p.monthly_price), student_limit: Number(p.student_limit), features: { whatsapp: !!p.features?.whatsapp, branding: !!p.features?.branding } }); setIsModalOpen(true); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('feature_')) {
      const k = name.replace('feature_', '') as "whatsapp" | "branding";
      setFormData(prev => ({ ...prev, features: { ...prev.features, [k]: checked } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Nama paket wajib diisi.");
    if (formData.student_limit < 1) return alert("Batas siswa minimal 1.");
    if (formData.monthly_price < 0) return alert("Harga tidak boleh negatif.");
    try {
      if (editingId) {
        const { error } = await supabase.from('plans').update(formData as never).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('plans').insert([formData] as never);
        if (error) throw error;
      }
      setIsModalOpen(false); setEditingId(null); fetchPlans();
    } catch (err: unknown) { alert("Gagal: " + (err as Error).message); }
  };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paket Langganan</h1><p className="text-sm text-slate-500 mt-1">Atur harga & limit SaaS.</p></div>
        <button onClick={openAdd} className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><i className="ti ti-plus text-lg" />Tambah Paket</button>
      </div>
      {loading ? <div className="flex flex-col items-center py-24 gap-3 bg-white rounded-3xl border border-slate-100"><i className="ti ti-loader-2 text-4xl animate-spin text-brand-500" /><p className="text-sm text-slate-500">Memuat...</p></div>
      : plans.length === 0 ? <div className="flex flex-col items-center py-24 gap-4 bg-white rounded-3xl border border-slate-100 text-center px-4"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100"><i className="ti ti-package text-4xl text-brand-400" /></div><h3 className="text-xl font-bold text-slate-800">Belum Ada Paket</h3><p className="text-slate-500 text-sm max-w-sm">Buat paket pertama seperti Basic / Pro.</p><button onClick={openAdd} className="mt-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">Buat Paket</button></div>
      : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group relative overflow-hidden">
            {plan.monthly_price > 100000 && <div className="absolute top-5 -right-8 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[10px] font-bold py-1 px-10 rotate-45">PRO</div>}
            <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>openEdit(plan)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:text-brand-600 shadow-sm"><i className="ti ti-pencil text-base" /></button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-danger-500 flex items-center justify-center hover:bg-danger-50 shadow-sm" onClick={async () => { if (confirm('Hapus paket ini?')) { await supabase.from('plans').delete().eq('id', plan.id); fetchPlans(); } }}><i className="ti ti-trash text-base" /></button>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5"><span className="text-4xl font-black text-slate-900 tracking-tight">{formatRupiah(plan.monthly_price)}</span><span className="text-sm font-semibold text-slate-400">/ bln</span></div>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <ul className="flex flex-col gap-4">
                {[
                  { label: `Maksimal ${plan.student_limit} Siswa`, enabled: true },
                  { label: "Notifikasi WA", enabled: !!plan.features?.whatsapp },
                  { label: "Custom Branding", enabled: !!plan.features?.branding },
                  { label: "Prioritas Support", enabled: plan.monthly_price > 100000 },
                ].map((f,i)=><li key={i} className="flex items-start gap-3 text-sm"><div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${f.enabled?'bg-brand-100 text-brand-600':'bg-slate-100 text-slate-300'}`}><i className={`ti ${f.enabled?'ti-check':'ti-x'} text-xs`} /></div><span className={`font-medium ${f.enabled?'text-slate-700':'text-slate-400 line-through'}`}>{f.label}</span></li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit Paket" : "Tambah Paket"}</h3><button onClick={()=>setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"><i className="ti ti-x text-xl" /></button></div>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Nama Paket</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} /></div>
                <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Harga / Bulan (Rp)</label><input type="number" name="monthly_price" value={formData.monthly_price} onChange={handleInputChange} required min={0} className={inputClass} /></div>
                <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Batas Siswa</label><input type="number" name="student_limit" value={formData.student_limit} onChange={handleInputChange} required min={1} className={inputClass} /></div>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer"><input type="checkbox" name="feature_whatsapp" checked={formData.features.whatsapp} onChange={handleInputChange} className="w-5 h-5 accent-brand-600" /><span className="text-sm font-medium text-slate-700">Notifikasi WhatsApp</span></label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer"><input type="checkbox" name="feature_branding" checked={formData.features.branding} onChange={handleInputChange} className="w-5 h-5 accent-brand-600" /><span className="text-sm font-medium text-slate-700">Custom Branding</span></label>
              </div>
              <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600">Batal</button><button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white flex items-center gap-2"><i className="ti ti-device-floppy" />Simpan Paket</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
