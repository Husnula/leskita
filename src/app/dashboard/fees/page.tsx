"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/lib/useDebounce";
import { logger } from "@/lib/logger";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { pdf } from '@react-pdf/renderer';
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { formatRupiah, generateInvoiceNo } from "@/lib/format";
import { buildFeeWaMessage, buildWaLink } from "@/lib/whatsapp";
dayjs.locale('id');
const PAGE_SIZE = 10;
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400";
type FeeRow = { id: string; invoice_no: string | null; period: string; amount: number; status: string; due_date: string; created_at: string | null; description: string; students: { name: string; parent_phone: string | null } | null };
type StudentOpt = { id: string; name: string; fee_amount: number };
export default function FeesPage() {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [paymentInstructions, setPaymentInstructions] = useState("Silakan transfer ke rekening BCA 1234567890 a.n Pengajar");
  const [waTemplate, setWaTemplate] = useState("");
  const [formData, setFormData] = useState({ student_id: "", period: dayjs().format("YYYY-MM"), description: "Tagihan Les Bulanan", amount: 0, due_date: dayjs().add(10, 'day').format("YYYY-MM-DD") });
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
      if (profile) {
        setTenantId(profile.tenant_id);
        const { data: studentsData } = await supabase.from('students').select('id, name, fee_amount').eq('tenant_id', profile.tenant_id).eq('status', 'ACTIVE');
        if (studentsData) setStudents(studentsData as StudentOpt[]);
        let query = supabase.from('fees').select('*, students(name, parent_phone)', { count: 'exact' }).eq('tenant_id', profile.tenant_id);
        if (statusFilter !== "all") {
          if (statusFilter === "OVERDUE") query = query.neq('status','PAID').lt('due_date', dayjs().format('YYYY-MM-DD'));
          else query = query.eq('status', statusFilter);
        }
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.trim().replace(/%/g,"");
          query = query.or(`invoice_no.ilike.%${q}%,period.ilike.%${q}%`);
        }
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data: feesData, count } = await query.order('created_at', { ascending: false }).range(from, to) as { data: FeeRow[] | null; count: number | null };
        if (feesData) setFees(feesData as FeeRow[]);
        else setFees([]);
        setTotalCount(count ?? 0);
        const { data: ts } = await supabase.from('teacher_settings').select('payment_instructions, whatsapp_template').eq('tenant_id', profile.tenant_id).maybeSingle() as { data: { payment_instructions: string | null; whatsapp_template: string | null } | null };
        if (ts?.payment_instructions) setPaymentInstructions(ts.payment_instructions);
        if (ts?.whatsapp_template) setWaTemplate(ts.whatsapp_template);
      }
    } catch (e) { logger.error("fetch fees", e); } finally { setLoading(false); }
  }, [debouncedSearch, statusFilter, page]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'student_id') {
      const st = students.find(s => s.id === value);
      setFormData(prev => ({ ...prev, student_id: value, amount: st ? st.fee_amount : prev.amount }));
    } else setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return alert("Tenant tidak ditemukan.");
    if (!formData.student_id) return alert("Pilih siswa.");
    setIsSubmitting(true);
    try {
      const invoiceNo = generateInvoiceNo();
      const { error } = await supabase.from('fees').insert({ tenant_id: tenantId, student_id: formData.student_id, period: formData.period, description: formData.description, amount: Number(formData.amount), due_date: formData.due_date, status: 'UNPAID', invoice_no: invoiceNo } as never);
      if (error) throw error;
      setIsModalOpen(false); fetchData();
    } catch (err: unknown) { logger.error("create fee", err); alert("Gagal: " + (err as Error).message); } finally { setIsSubmitting(false); }
  };
  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from('fees').update({ status: 'PAID', paid_at: new Date().toISOString() } as never).eq('id', id);
    if (error) return alert(error.message);
    fetchData();
  };
  const downloadPDF = async (fee: FeeRow) => {
    try {
      const blob = await pdf(<InvoiceDocument type={fee.status === 'PAID' ? 'RECEIPT' : 'INVOICE'} invoiceNumber={fee.invoice_no ?? "-"} date={dayjs(fee.created_at ?? undefined).format('DD MMMM YYYY')} studentName={fee.students?.name ?? "-"} parentName="Orang Tua / Wali Siswa" period={fee.period} amount={fee.amount} description={fee.description} paymentInstructions={paymentInstructions} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${fee.invoice_no ?? fee.id}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch { alert("Gagal PDF."); }
  };
  const buildWaMessage = (fee: FeeRow) => buildFeeWaMessage(fee, { whatsapp_template: waTemplate, payment_instructions: paymentInstructions });
  const generateAutoFees = async () => {
    if (!tenantId) return alert("Tenant tidak ditemukan.");
    if (!confirm("Buat tagihan otomatis untuk semua siswa aktif bulan ini yang belum punya tagihan?")) return;
    setIsSubmitting(true);
    try {
      const currentPeriod = dayjs().format("YYYY-MM");
      const { data: activeStudents } = await supabase.from('students').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE') as { data: { id: string; fee_amount: number }[] | null };
      if (!activeStudents?.length) return alert("Tidak ada siswa aktif.");
      const { data: existingFees } = await supabase.from('fees').select('student_id').eq('tenant_id', tenantId).eq('period', currentPeriod) as { data: { student_id: string }[] | null };
      const existingIds = new Set((existingFees ?? []).map(f => f.student_id));
      const toBill = activeStudents.filter(s => !existingIds.has(s.id));
      if (toBill.length === 0) return alert("Semua sudah punya tagihan periode ini.");
      const payload = toBill.map(s => ({ tenant_id: tenantId, student_id: s.id, period: currentPeriod, description: "Tagihan Les Bulanan (Otomatis)", amount: s.fee_amount || 0, due_date: dayjs().add(10, 'day').format("YYYY-MM-DD"), status: 'UNPAID', invoice_no: generateInvoiceNo() }));
      const { error } = await supabase.from('fees').insert(payload as never);
      if (error) throw error;
      alert(`Berhasil membuat ${payload.length} tagihan!`); fetchData();
    } catch (err: unknown) { logger.error("auto fees", err); alert("Gagal: " + (err as Error).message); } finally { setIsSubmitting(false); }
  };
  const isOverdue = (f: FeeRow) => f.status !== 'PAID' && dayjs(f.due_date).isBefore(dayjs(), 'day');
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tagihan & Pembayaran</h1><p className="text-sm text-slate-500 mt-1">Kelola tagihan, pantau overdue, WA & PDF.</p></div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={generateAutoFees} disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><i className={`ti ${isSubmitting ? 'ti-loader-2 animate-spin' : 'ti-refresh'} text-lg`} />Auto-Generate</button>
          <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><i className="ti ti-file-invoice text-lg" />Buat Tagihan</button>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-5 border-b border-slate-100 gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            <input type="text" placeholder="Cari invoice / periode..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">
            <option value="all">Semua Status</option><option value="UNPAID">Belum Lunas</option><option value="PAID">Lunas</option><option value="PARTIAL">Parsial</option><option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["No. Tagihan","Nama Siswa","Periode","Jatuh Tempo","Nominal","Status",""].map((h,i)=><th key={h} className={`px-6 py-4 text-[11px] font-bold uppercase text-slate-400 ${i===6?'text-right':''}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? Array.from({length:4}).map((_,i)=><tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td></tr>)
              : fees.length===0 ? <tr><td colSpan={7} className="p-20 text-center"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100"><i className="ti ti-receipt-2 text-3xl text-slate-300" /></div><h3 className="text-lg font-bold text-slate-700">Tidak ada tagihan</h3><p className="text-slate-500 text-sm max-w-[250px] mx-auto mt-1">Sesuaikan filter atau buat tagihan baru.</p></td></tr>
              : fees.map(fee => {
                const overdue = isOverdue(fee);
                return (
                  <tr key={fee.id} className={`hover:bg-slate-50/80 group ${overdue ? 'bg-danger-50/30' : ''}`}>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-brand-600">{fee.invoice_no}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{fee.students?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{fee.period}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${overdue ? 'text-danger-600 font-bold' : 'text-slate-600'}`}>{dayjs(fee.due_date).format('DD MMM YYYY')}{overdue && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-500 text-white">OVERDUE</span>}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{formatRupiah(fee.amount)}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${fee.status==='PAID'?'bg-success-50 text-success-700 border-success-200':fee.status==='PARTIAL'?'bg-warning-50 text-warning-700 border-warning-200':overdue?'bg-danger-50 text-danger-700 border-danger-200':'bg-slate-100 text-slate-600 border-slate-200'}`}>{fee.status==='PAID'?'Lunas':fee.status==='PARTIAL'?'Parsial':overdue?'Jatuh Tempo':'Belum Lunas'}</span></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {fee.status !== 'PAID' && <button onClick={()=>markAsPaid(fee.id)} title="Tandai Lunas" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-success-500 flex items-center justify-center hover:bg-success-50"><i className="ti ti-check text-base" /></button>}
                      <button onClick={()=>{ const msg=buildWaMessage(fee); window.open(buildWaLink(fee.students?.parent_phone ?? "", msg),'_blank'); }} title="WA" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-brand-500 flex items-center justify-center hover:bg-brand-50"><i className="ti ti-brand-whatsapp text-base" /></button>
                      <button onClick={()=>downloadPDF(fee)} title="PDF" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"><i className="ti ti-download text-base" /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Menampilkan <strong className="text-slate-800">{fees.length}</strong> dari <strong className="text-slate-800">{totalCount}</strong> · Hal {page}/{totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-50 border border-transparent hover:border-slate-200"><i className="ti ti-chevron-left" /></button>
            <span className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700">{page}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-50 border border-transparent hover:border-slate-200"><i className="ti ti-chevron-right" /></button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Buat Tagihan Baru</h3><button onClick={()=>setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"><i className="ti ti-x text-xl" /></button></div>
            <form onSubmit={handleCreateFee} className="flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-6">
                <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Pilih Siswa *</label><select name="student_id" value={formData.student_id} onChange={handleInputChange} className={inputClass} required><option value="">-- Pilih Siswa --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="col-span-2 flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Deskripsi *</label><input type="text" name="description" value={formData.description} onChange={handleInputChange} className={inputClass} required /></div>
                <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Periode (YYYY-MM) *</label><input type="text" name="period" value={formData.period} onChange={handleInputChange} className={inputClass} required /></div>
                <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Nominal (Rp) *</label><input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className={inputClass} required min={0} /></div>
                <div className="flex flex-col gap-2 sm:col-span-2"><label className="text-sm font-semibold text-slate-700">Jatuh Tempo *</label><input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className={inputClass} required /></div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600">Batal</button><button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white flex items-center gap-2 disabled:opacity-50"><i className={`ti ${isSubmitting?'ti-loader-2 animate-spin':'ti-receipt'} text-lg`} />{isSubmitting?'Menyimpan...':'Buat Tagihan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
