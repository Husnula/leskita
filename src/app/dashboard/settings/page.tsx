"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-slate-400";
const inputDisabledClass = "w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium";
const areaClass = inputClass + " min-h-[90px]";
type Tab = "profile" | "workspace" | "payment" | "billing";
const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "profile", icon: "ti-user", label: "Profil Akun" },
  { id: "workspace", icon: "ti-building", label: "Detail Workspace" },
  { id: "payment", icon: "ti-receipt", label: "Pembayaran & WA" },
  { id: "billing", icon: "ti-credit-card", label: "Paket Langganan" },
];
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [profileData, setProfileData] = useState({ name: "", avatar_url: "" });
  const [tenantData, setTenantData] = useState({ workspace_name: "" });
  const [settingsData, setSettingsData] = useState({ phone: "", payment_instructions: "", default_fee_amount: "", default_due_day: "10", whatsapp_template: "" });
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      setEmail(session.user.email || "");
      const { data: profile } = await supabase.from('profiles').select('*, tenants(*)').eq('id', session.user.id).single() as { data: { tenant_id: string; name: string | null; avatar_url?: string | null; tenants: { workspace_name: string } | null } | null };
      if (profile) {
        setTenantId(profile.tenant_id);
        setProfileData({ name: profile.name || "", avatar_url: (profile as any).avatar_url || "" });
        if (profile.tenants) setTenantData({ workspace_name: profile.tenants.workspace_name || "" });
        const { data: ts } = await supabase.from('teacher_settings').select('*').eq('tenant_id', profile.tenant_id).maybeSingle() as { data: { phone: string | null; payment_instructions: string | null; default_fee_amount: number | null; default_due_day: number | null; whatsapp_template: string | null } | null };
        if (ts) setSettingsData({ phone: ts.phone ?? "", payment_instructions: ts.payment_instructions ?? "", default_fee_amount: ts.default_fee_amount != null ? String(ts.default_fee_amount) : "", default_due_day: ts.default_due_day != null ? String(ts.default_due_day) : "10", whatsapp_template: ts.whatsapp_template ?? "" });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) return alert("Maksimal 800KB.");
    if (!["image/jpeg","image/png","image/gif","image/webp"].includes(file.type)) return alert("Format harus JPG/PNG/GIF/WEBP.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: avatarUrl } as never).eq('id', userId);
      if (updErr) throw updErr;
      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
      alert("Foto profil diperbarui!");
    } catch (err: unknown) { alert("Gagal upload: " + (err as Error).message); } finally { setUploading(false); }
  };
  const saveSettings = async () => {
    setSaving(true);
    try {
      if (activeTab === "profile") {
        const { error } = await supabase.from('profiles').update({ name: profileData.name } as never).eq('id', userId);
        if (error) throw error;
        alert("Profil diperbarui!");
      }
      if (activeTab === "workspace" && tenantId) {
        const { error } = await supabase.from('tenants').update({ workspace_name: tenantData.workspace_name } as never).eq('id', tenantId);
        if (error) throw error;
        alert("Workspace diperbarui!");
      }
      if (activeTab === "payment" && tenantId) {
        const payload = { tenant_id: tenantId, teacher_name: profileData.name || "Guru", workspace_name: tenantData.workspace_name || "Workspace", phone: settingsData.phone || null, payment_instructions: settingsData.payment_instructions || null, default_fee_amount: settingsData.default_fee_amount ? Number(settingsData.default_fee_amount) : null, default_due_day: Number(settingsData.default_due_day) || 10, whatsapp_template: settingsData.whatsapp_template || null };
        const { data: existing } = await supabase.from('teacher_settings').select('id').eq('tenant_id', tenantId).maybeSingle() as { data: { id: string } | null };
        if (existing) {
          const { error } = await supabase.from('teacher_settings').update(payload as never).eq('tenant_id', tenantId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('teacher_settings').insert(payload as never);
          if (error) throw error;
        }
        alert("Pengaturan pembayaran & WA disimpan!");
      }
    } catch (err: unknown) { alert("Gagal: " + (err as Error).message); } finally { setSaving(false); }
  };
  if (loading) return <div className="flex h-[400px] flex-col items-center justify-center gap-3"><i className="ti ti-loader-2 text-4xl animate-spin text-brand-500" /><p className="text-sm text-slate-500">Memuat...</p></div>;
  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan</h1><p className="text-sm text-slate-500 mt-1">Kelola preferensi akun & lembaga.</p></div>
        <button onClick={saveSettings} disabled={saving || activeTab === 'billing'} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><i className={`ti ${saving ? 'ti-loader-2 animate-spin' : 'ti-device-floppy'} text-lg`} />{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-2 w-full md:w-64 shrink-0 bg-white p-3 rounded-3xl border border-slate-100 shadow-sm h-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-left ${activeTab === tab.id ? 'bg-brand-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
              <i className={`ti ${tab.icon} text-lg`} />{tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="flex flex-col h-full">
              <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">Profil Akun</h3><p className="text-sm text-slate-500">Informasi login & foto profil (bucket avatars).</p></div>
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex items-center gap-5">
                  {profileData.avatar_url ? <img src={profileData.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" /> : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-3xl">{profileData.name ? profileData.name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}</div>}
                  <div>
                    <label className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-2">
                      {uploading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-photo" />}
                      {uploading ? "Mengupload..." : "Ubah Foto Profil"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-2">JPG/PNG/GIF/WEBP, maks 800KB. Public bucket avatars.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Nama Lengkap</label><input type="text" value={profileData.name} onChange={e=>setProfileData({ ...profileData, name: e.target.value })} className={inputClass} placeholder="Nama lengkap" /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Alamat Email</label><input type="email" value={email} disabled className={inputDisabledClass} /><span className="text-[11px] text-slate-400">Email terhubung otentikasi.</span></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'workspace' && (
            <div className="flex flex-col h-full">
              <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">Detail Workspace</h3><p className="text-sm text-slate-500">Lembaga / tempat les.</p></div>
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2 max-w-lg"><label className="text-sm font-semibold text-slate-700">Nama Lembaga / Workspace</label><input type="text" value={tenantData.workspace_name} onChange={e=>setTenantData({ workspace_name: e.target.value })} className={inputClass} placeholder="LesKita Academy" /></div>
                <div className="flex flex-col gap-2 max-w-lg"><label className="text-sm font-semibold text-slate-700">ID Workspace</label><div className="relative"><i className="ti ti-fingerprint absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" /><input type="text" value={tenantId} disabled className={`${inputDisabledClass} pl-10 font-mono text-xs`} /></div><span className="text-[11px] text-slate-400">Identifier unik tenant.</span></div>
              </div>
            </div>
          )}
          {activeTab === 'payment' && (
            <div className="flex flex-col h-full">
              <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">Pembayaran & WA</h3><p className="text-sm text-slate-500">Instruksi bayar, default tagihan, template WA.</p></div>
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                  <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">No. HP Guru</label><input value={settingsData.phone} onChange={e=>setSettingsData({ ...settingsData, phone: e.target.value })} className={inputClass} placeholder="0812xxxx" /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Default Tarif (Rp)</label><input type="number" value={settingsData.default_fee_amount} onChange={e=>setSettingsData({ ...settingsData, default_fee_amount: e.target.value })} className={inputClass} min={0} /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-semibold text-slate-700">Jatuh Tempo Default (tgl)</label><input type="number" value={settingsData.default_due_day} onChange={e=>setSettingsData({ ...settingsData, default_due_day: e.target.value })} className={inputClass} min={1} max={28} /></div>
                </div>
                <div className="flex flex-col gap-2 max-w-2xl"><label className="text-sm font-semibold text-slate-700">Instruksi Pembayaran</label><textarea value={settingsData.payment_instructions} onChange={e=>setSettingsData({ ...settingsData, payment_instructions: e.target.value })} className={areaClass} placeholder="Transfer BCA 123..." /></div>
                <div className="flex flex-col gap-2 max-w-2xl"><label className="text-sm font-semibold text-slate-700">Template WA Tagihan</label><textarea value={settingsData.whatsapp_template} onChange={e=>setSettingsData({ ...settingsData, whatsapp_template: e.target.value })} className={areaClass} placeholder="Halo {{parent}}, tagihan {{student}} periode {{period}} sebesar {{amount}} jatuh tempo {{due_date}}. {{payment_instructions}}" /><span className="text-[11px] text-slate-400">Placeholder: {"{{student}} {{parent}} {{period}} {{amount}} {{due_date}} {{payment_instructions}}"}</span></div>
              </div>
            </div>
          )}
          {activeTab === 'billing' && (
            <div className="flex flex-col h-full">
              <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">Langganan</h3><p className="text-sm text-slate-500">Paket aktif & upgrade.</p></div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-6"><i className="ti ti-receipt text-brand-600 text-3xl" /></div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning-100 text-warning-700 text-xs font-bold mb-3">Trial Aktif</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Paket Trial</h3>
                <p className="text-sm text-slate-500 max-w-md mb-6">Hubungi admin untuk upgrade ke Pro.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
