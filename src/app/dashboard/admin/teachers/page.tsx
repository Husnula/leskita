"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createTenantManual, deleteTenantManual } from "@/app/actions/admin";

// ─── Shared input style ───────────────────────────────────────────────────────
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminTeachers() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({ plan_id: '', status: '' });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    workspaceName: '',
    teacherName: '',
    email: '',
    password: '',
    planId: '',
    status: 'TRIAL',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select(`*, profiles(name, email, role), plan:plan_id (name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTenants(data);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('id, name').order('monthly_price', { ascending: true });
    if (data) setPlans(data);
  };

  const openEditModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setEditForm({ plan_id: tenant.plan_id || '', status: tenant.status });
    setIsEditModalOpen(true);
  };

  const handleUpdateTenant = async (e: any) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          plan_id: editForm.plan_id === '' ? null : editForm.plan_id,
          status: editForm.status,
        })
        .eq('id', selectedTenant.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchTenants();
    } catch (error: any) {
      alert("Gagal memperbarui tenant: " + error.message);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus workspace "${name}" beserta seluruh data siswanya secara permanen?`)) return;

    setIsSubmitting(true);
    try {
      const result = await deleteTenantManual(id);
      if (!result.success) throw new Error(result.message);
      alert(result.message);
      fetchTenants();
    } catch (error: any) {
      alert("Gagal menghapus tenant: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTenant = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createTenantManual({
        workspaceName: addForm.workspaceName,
        teacherName: addForm.teacherName,
        email: addForm.email,
        password: addForm.password || undefined,
        planId: addForm.planId === '' ? null : addForm.planId,
        status: addForm.status,
      });

      if (!result.success) throw new Error(result.message);

      alert(result.message);
      setIsAddModalOpen(false);
      setAddForm({ workspaceName: '', teacherName: '', email: '', password: '', planId: '', status: 'TRIAL' });
      fetchTenants();
    } catch (error: any) {
      alert("Gagal menambah tenant: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'ACTIVE') return 'bg-success-50 text-success-700';
    if (status === 'TRIAL') return 'bg-warning-50 text-warning-700';
    return 'bg-slate-100 text-slate-600';
  };

  const statusBadgeLabel = (status: string) => {
    if (status === 'ACTIVE') return 'Aktif';
    if (status === 'TRIAL') return 'Trial';
    if (status === 'SUSPENDED') return 'Suspended';
    return status;
  };

  const filteredTenants = tenants
    .filter(t => filterStatus === "ALL" || t.status === filterStatus)
    .filter(t =>
      t.workspace_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles?.some((p: any) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Guru & Lembaga</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data guru, status berlangganan, dan workspace di platform Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            <i className="ti ti-user-plus text-lg" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* ── Filter Chips ─────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "ALL", label: `Semua (${tenants.length})` },
          { id: "ACTIVE", label: `Aktif (${tenants.filter(t => t.status === 'ACTIVE').length})` },
          { id: "TRIAL", label: `Menunggu/Trial (${tenants.filter(t => t.status === 'TRIAL').length})` }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === filter.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* ── Cards Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <i className="ti ti-loader-2 text-4xl animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-500">Memuat data guru...</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
             <i className="ti ti-search text-3xl text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tidak ada hasil</h3>
          <p className="text-slate-500 text-sm max-w-[250px]">Kami tidak menemukan guru yang cocok dengan kriteria pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTenants.map(tenant => {
            const teacherProfile = tenant.profiles?.find((p: any) => p.role === 'TEACHER') || tenant.profiles?.[0];
            const teacherName = teacherProfile?.name || 'Unknown';

            return (
              <div key={tenant.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col overflow-hidden group">
                
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-lg shadow-inner group-hover:scale-110 transition-transform">
                      {teacherName.charAt(0).toUpperCase()}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadgeVariant(tenant.status)}`}>
                      {tenant.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-success-500 shrink-0" />}
                      {statusBadgeLabel(tenant.status)}
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-bold text-slate-800 line-clamp-1" title={teacherName}>{teacherName}</div>
                    <div className="text-[12px] font-medium text-slate-500 truncate" title={teacherProfile?.email}>{teacherProfile?.email || '-'}</div>
                  </div>

                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Workspace & Paket</div>
                    <div className="text-sm font-semibold text-slate-700 line-clamp-1">{tenant.workspace_name}</div>
                    <div className="text-xs text-brand-600 font-medium mt-0.5">{tenant.plan?.name || 'Free Tier'}</div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                    <i className="ti ti-calendar-stats text-[14px]" />
                    Joined {new Date(tenant.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      title="Edit"
                      onClick={() => openEditModal(tenant)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-brand-300 hover:text-brand-600 shadow-sm transition-colors"
                    >
                      <i className="ti ti-pencil text-[16px]" />
                    </button>
                    <button
                      title="Hapus"
                      onClick={() => handleDeleteTenant(tenant.id, tenant.workspace_name)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-danger-500 flex items-center justify-center hover:bg-danger-50 hover:border-danger-200 shadow-sm transition-colors"
                    >
                      <i className="ti ti-trash text-[16px]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      {isEditModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border border-white/20">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Edit Workspace</h3>
              <button className="text-slate-400 hover:text-slate-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100" onClick={() => setIsEditModalOpen(false)}>
                <i className="ti ti-x text-xl" />
              </button>
            </div>

            <form onSubmit={handleUpdateTenant} className="flex flex-col">
              <div className="p-6 flex flex-col gap-5">
                <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl">
                  <div className="text-base font-bold text-brand-900">{selectedTenant.workspace_name}</div>
                  <div className="text-sm font-medium text-brand-700/80 mt-0.5">Pemilik: {selectedTenant.profiles?.find((p: any) => p.role === 'TEACHER')?.name || 'Unknown'}</div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Status Akun</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className={inputClass}
                  >
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active (Berlangganan)</option>
                    <option value="SUSPENDED">Suspended (Blokir)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Paket Langganan (Plan)</label>
                  <select
                    value={editForm.plan_id}
                    onChange={e => setEditForm({ ...editForm, plan_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">-- Free Tier / Tidak Ada --</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50">
                <button type="button" className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Modal ────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Tambah Guru Baru</h3>
              <button className="text-slate-400 hover:text-slate-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100" onClick={() => setIsAddModalOpen(false)}>
                <i className="ti ti-x text-xl" />
              </button>
            </div>

            <form onSubmit={handleAddTenant} className="flex flex-col min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-6 overflow-y-auto">
                {[
                  { label: "Nama Lengkap Guru *", name: "teacherName", type: "text", placeholder: "Misal: Budi Santoso", required: true, value: addForm.teacherName, onChange: (v: string) => setAddForm({ ...addForm, teacherName: v }) },
                  { label: "Nama Workspace *", name: "workspaceName", type: "text", placeholder: "Misal: Budi Course", required: true, value: addForm.workspaceName, onChange: (v: string) => setAddForm({ ...addForm, workspaceName: v }) },
                  { label: "Alamat Email *", name: "email", type: "email", placeholder: "guru@example.com", required: true, value: addForm.email, onChange: (v: string) => setAddForm({ ...addForm, email: v }) },
                  { label: "Password (Opsional)", name: "password", type: "text", placeholder: "Default: Password123!", required: false, value: addForm.password, onChange: (v: string) => setAddForm({ ...addForm, password: v }) },
                ].map(field => (
                  <div key={field.name} className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">{field.label}</label>
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Paket Langganan</label>
                  <select value={addForm.planId} onChange={e => setAddForm({ ...addForm, planId: e.target.value })} className={inputClass}>
                    <option value="">-- Free Tier --</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Status Awal</label>
                  <select value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })} className={inputClass}>
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active (Lunas)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button type="button" className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors" disabled={isSubmitting} onClick={() => setIsAddModalOpen(false)}>Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all flex items-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><i className="ti ti-loader-2 animate-spin text-lg"></i> Memproses...</>
                  ) : (
                    <><i className="ti ti-user-plus text-lg"></i> Daftarkan Guru</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
