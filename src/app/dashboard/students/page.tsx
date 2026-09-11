"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/lib/useDebounce";
import { logger } from "@/lib/logger";
type Student = { id: string; name: string; grade: string | null; subject: string; parent_name: string; parent_email: string; phone: string | null; parent_phone: string | null; fee_amount: number; status: string; created_at: string | null; };
const PAGE_SIZE = 12;
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400";
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-danger-500 ml-1">*</span>}</label>{children}</div>;
}
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v: string) => !v || /^08\d{7,13}$/.test(v.replace(/[^0-9]/g,""));
export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", grade: "", subject: "", parent_name: "", parent_email: "", phone: "", fee_amount: 0 });
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
      if (!profile) return;
      setTenantId(profile.tenant_id);
      let query = supabase.from('students').select('*', { count: 'exact' }).eq('tenant_id', profile.tenant_id);
      if (statusFilter !== "all") query = query.eq('status', statusFilter);
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().replace(/%/g, "");
        query = query.or(`name.ilike.%${q}%,parent_name.ilike.%${q}%`);
      }
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await query.order('name').range(from, to) as { data: Student[] | null; count: number | null; error: { message: string } | null };
      if (error) throw error;
      setStudents((data as Student[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (e) { logger.error("fetch students", e); } finally { setLoading(false); }
  }, [debouncedSearch, statusFilter, page]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "fee_amount" ? Number(value) : value }));
  };
  const resetForm = () => { setFormData({ name: "", grade: "", subject: "", parent_name: "", parent_email: "", phone: "", fee_amount: 0 }); setEditingId(null); };
  const openAdd = () => { resetForm(); setIsModalOpen(true); };
  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setFormData({ name: s.name, grade: s.grade ?? "", subject: s.subject, parent_name: s.parent_name, parent_email: s.parent_email, phone: s.phone ?? s.parent_phone ?? "", fee_amount: Number(s.fee_amount) });
    setIsModalOpen(true);
  };
  const validate = () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.parent_name.trim()) return "Nama, mapel, dan nama wali wajib diisi.";
    if (!isEmail(formData.parent_email)) return "Email wali tidak valid.";
    if (!isPhone(formData.phone)) return "No HP harus format 08... (8-15 digit).";
    if (Number(formData.fee_amount) < 0) return "Tarif tidak boleh negatif.";
    return null;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);
    if (!tenantId) return alert("Tenant tidak ditemukan.");
    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('students').update({ name: formData.name, grade: formData.grade || null, subject: formData.subject, parent_name: formData.parent_name, parent_email: formData.parent_email, phone: formData.phone || null, parent_phone: formData.phone || null, fee_amount: Number(formData.fee_amount) } as never).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert({ tenant_id: tenantId, name: formData.name, grade: formData.grade || null, subject: formData.subject, parent_name: formData.parent_name, parent_email: formData.parent_email, phone: formData.phone || null, parent_phone: formData.phone || null, fee_amount: Number(formData.fee_amount), status: 'ACTIVE' } as never);
        if (error) throw error;
      }
      setIsModalOpen(false); resetForm(); fetchData();
    } catch (error: unknown) { logger.error("save student", error); alert("Gagal menyimpan: " + (error as Error).message); } finally { setIsSubmitting(false); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus siswa ini?")) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) return alert(error.message);
    fetchData();
  };
  const toggleStatus = async (s: Student) => {
    const next = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { error } = await supabase.from('students').update({ status: next } as never).eq('id', s.id);
    if (error) return alert(error.message);
    fetchData();
  };
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Siswa</h1><p className="text-sm text-slate-500 mt-1">Kelola murid, jenjang, mapel, dan kontak wali.</p></div>
        <button onClick={openAdd} className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2"><i className="ti ti-user-plus text-lg" />Tambah Siswa</button>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-5 border-b border-slate-100 gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            <input type="text" placeholder="Cari nama siswa atau orang tua..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none">
            <option value="all">Semua Status</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Tidak Aktif</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead><tr className="border-b border-slate-100 bg-white">{["Nama Siswa","Kelas / Mapel","Nama Wali","No. HP / WA","Status",""].map((h,i)=><th key={h} className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${i===5?'text-right':''}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? Array.from({length:4}).map((_,i)=><tr key={i}>{Array.from({length:6}).map((_,j)=><td key={j} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td>)}</tr>)
              : students.length===0 ? <tr><td colSpan={6}><div className="flex flex-col items-center justify-center py-20 text-center px-4"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100"><i className="ti ti-users-group text-3xl text-slate-300" /></div><h3 className="text-lg font-bold text-slate-700">Tidak ada data</h3><p className="text-slate-500 text-sm max-w-[250px] mt-1">Tidak ditemukan atau belum ada data siswa.</p></div></td></tr>
              : students.map(s=>(
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm shadow-inner shrink-0">{s.name.charAt(0).toUpperCase()}</div><span className="text-sm font-bold text-slate-800">{s.name}</span></div></td>
                  <td className="px-6 py-4"><div className="flex flex-col"><span className="text-sm font-semibold text-slate-700">{s.subject}</span><span className="text-[12px] font-medium text-slate-500">{s.grade ?? "-"}</span></div></td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{s.parent_name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{s.phone || s.parent_phone || '-'}</td>
                  <td className="px-6 py-4"><button onClick={()=>toggleStatus(s)} title="Toggle status" className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.status==='ACTIVE'?'bg-success-50 text-success-700':'bg-slate-100 text-slate-600'}`}>{s.status==='ACTIVE'&&<span className="w-1.5 h-1.5 rounded-full bg-success-500 shrink-0" />}{s.status==='ACTIVE'?'Aktif':'Tidak Aktif'}</button></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>openEdit(s)} title="Edit" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:text-brand-600 hover:border-brand-300 shadow-sm"><i className="ti ti-pencil text-base" /></button><button onClick={()=>handleDelete(s.id)} title="Hapus" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-danger-500 flex items-center justify-center hover:bg-danger-50 shadow-sm"><i className="ti ti-trash text-base" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Menampilkan <strong className="text-slate-800">{students.length}</strong> dari <strong className="text-slate-800">{totalCount}</strong> siswa · Hal {page}/{totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-200"><i className="ti ti-chevron-left" /></button>
            <span className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700">{page}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-200"><i className="ti ti-chevron-right" /></button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit Siswa" : "Tambah Siswa Baru"}</h3><button onClick={()=>{setIsModalOpen(false); resetForm();}} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"><i className="ti ti-x text-xl" /></button></div>
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 overflow-y-auto">
                <FormField label="Nama Lengkap Siswa" required><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} placeholder="Kevin Wijaya" /></FormField>
                <FormField label="Mata Pelajaran" required><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required className={inputClass} /></FormField>
                <FormField label="Kelas / Jenjang"><input type="text" name="grade" value={formData.grade} onChange={handleInputChange} className={inputClass} placeholder="SMA Kelas 10" /></FormField>
                <FormField label="Tarif Les per Sesi (Rp)"><input type="number" name="fee_amount" value={formData.fee_amount} onChange={handleInputChange} min={0} className={inputClass} /></FormField>
                <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-100"><h4 className="text-sm font-bold text-slate-800 mb-4">Informasi Kontak Orang Tua/Wali</h4></div>
                <FormField label="Nama Orang Tua / Wali" required><input type="text" name="parent_name" value={formData.parent_name} onChange={handleInputChange} required className={inputClass} placeholder="Bp. Susanto" /></FormField>
                <FormField label="Email Wali" required><input type="email" name="parent_email" value={formData.parent_email} onChange={handleInputChange} required className={inputClass} placeholder="susanto@example.com" /></FormField>
                <div className="md:col-span-2"><FormField label="No. HP / WA Wali"><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`${inputClass} md:w-1/2`} placeholder="081234567890" /></FormField></div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button type="button" className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50" onClick={()=>{setIsModalOpen(false); resetForm();}}>Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-md flex items-center gap-2" disabled={isSubmitting}>{isSubmitting ? <><i className="ti ti-loader-2 animate-spin text-lg" /> Menyimpan...</> : <><i className="ti ti-device-floppy text-lg" /> {editingId ? "Update" : "Simpan"} Siswa</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
