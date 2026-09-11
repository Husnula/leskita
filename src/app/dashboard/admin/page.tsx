"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";

type StatCardProps = { label: string; value: string | number; trend?: string; trendPositive?: boolean; icon: string; iconBg: string; iconColor: string };
function StatCard({ label, value, trend, trendPositive, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} bg-opacity-10 border border-white/50 shadow-inner`}><i className={`ti ${icon} text-[22px] ${iconColor}`} /></div>
        {trend && <div className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${trendPositive ? 'bg-success-50 text-success-600' : 'bg-slate-100 text-slate-500'}`}>{trend}</div>}
      </div>
      <div><h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value}</h3><p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{label}</p></div>
    </div>
  );
}
function GridMenuCard({ icon, label, href, bgClass, iconClass }: { icon: string; label: string; href: string; bgClass: string; iconClass: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all active:scale-95 group">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bgClass} group-hover:scale-110 transition-transform shadow-inner`}><i className={`ti ${icon} text-3xl ${iconClass}`} /></div>
      <span className="text-sm font-bold text-slate-700 text-center">{label}</span>
    </Link>
  );
}
type ListRowProps = { name: string; meta?: string; metaEmpty?: string; badgeLabel?: string; badgeVariant?: string };
function ListRow({ name, meta, metaEmpty, badgeLabel, badgeVariant }: ListRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-2 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 shadow-inner">{name.charAt(0).toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-800 truncate">{name}</div>
        {meta ? <div className="text-[11px] sm:text-xs font-medium text-slate-500 truncate mt-0.5">{meta}</div> : <div className="text-[11px] sm:text-xs font-medium text-slate-400 italic truncate mt-0.5">{metaEmpty}</div>}
      </div>
      {badgeLabel && <div className="shrink-0"><span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full ${badgeVariant === 'aktif' ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-600'}`}>{badgeVariant === 'aktif' && <span className="w-1.5 h-1.5 rounded-full bg-success-500 shrink-0" />}{badgeLabel}</span></div>}
    </div>
  );
}
function BarRow({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="py-2.5">
      <div className="flex justify-between text-sm font-bold mb-2"><span className="text-slate-700">{label}</span><span className="text-slate-900">{value} akun</span></div>
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner"><div className={`h-full rounded-full ${colorClass} transition-all duration-1000`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

type RecentTenant = { id: string; workspace_name: string; status: string; created_at: string; plan: { name: string } | null; profiles: { name: string | null; email: string | null }[] | null };
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTenants: 0, activeTenants: 0, totalStudents: 0, mrr: 0, freeCount: 0, proCount: 0, enterpriseCount: 0 });
  const [recent, setRecent] = useState<RecentTenant[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { count: totalTenants } = await supabase.from('tenants').select('id', { count: 'exact', head: true });
        const { count: activeTenants } = await supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE');
        const { count: totalStudents } = await supabase.from('students').select('id', { count: 'exact', head: true });
        const { data: tenantsWithPlan } = await supabase.from('tenants').select('plan_id, status, plans!tenants_plan_id_fkey(monthly_price, name)') as unknown as { data: Array<{ plan_id: string | null; status: string; plans: { monthly_price: number; name: string } | null }> | null };
        let mrr = 0; let freeCount = 0; let proCount = 0; let enterpriseCount = 0;
        (tenantsWithPlan ?? []).forEach(t => {
          if (!t.plan_id || !t.plans) freeCount++;
          else if (t.plans.name.toLowerCase().includes('enter')) enterpriseCount++;
          else proCount++;
          if (t.status === 'ACTIVE' && t.plans) mrr += Number(t.plans.monthly_price);
        });
        if ((tenantsWithPlan ?? []).length === 0) freeCount = totalTenants ?? 0;
        const { data: recentData } = await supabase.from('tenants').select('id, workspace_name, status, created_at, plan:plan_id(name), profiles(name, email)').order('created_at', { ascending: false }).limit(5) as { data: RecentTenant[] | null };
        setStats({ totalTenants: totalTenants ?? 0, activeTenants: activeTenants ?? 0, totalStudents: totalStudents ?? 0, mrr, freeCount, proCount, enterpriseCount });
        setRecent(recentData ?? []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="flex flex-col items-center gap-4"><i className="ti ti-loader-2 animate-spin text-3xl text-brand-500" /><p className="text-sm font-medium text-slate-500">Memuat data dashboard...</p></div></div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-1 px-1 sm:px-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold w-fit mb-2"><i className="ti ti-shield-check text-brand-600 text-sm" /> Mode Super Admin</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
        <p className="text-sm sm:text-base text-slate-500">Pantau pertumbuhan SaaS LesKita Anda.</p>
      </div>
      <div className="block md:hidden"><h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Aksi Cepat</h2><div className="grid grid-cols-2 gap-4"><GridMenuCard icon="ti-chalkboard" label="Kelola Guru" href="/dashboard/admin/teachers" bgClass="bg-brand-50 border border-brand-100" iconClass="text-brand-600" /><GridMenuCard icon="ti-package" label="Paket SaaS" href="/dashboard/admin/plans" bgClass="bg-brand-50 border border-brand-100" iconClass="text-brand-600" /></div></div>
      <div><h2 className="text-lg font-bold text-slate-800 mb-4 px-1 md:hidden">Ringkasan</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Total Lembaga" value={stats.totalTenants} icon="ti-building-skyscraper" iconBg="bg-brand-500" iconColor="text-brand-600" />
        <StatCard label="Aktif Berlangganan" value={stats.activeTenants} icon="ti-plug-connected" iconBg="bg-success-500" iconColor="text-success-600" />
        <StatCard label="Siswa Terdaftar" value={stats.totalStudents} icon="ti-users-group" iconBg="bg-brand-500" iconColor="text-brand-600" />
        <StatCard label="Estimasi MRR" value={stats.mrr > 0 ? formatRupiah(stats.mrr) : "Rp 0"} icon="ti-chart-bar" iconBg="bg-warning-500" iconColor="text-warning-600" />
      </div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800">Pendaftar Terbaru</h2><Link href="/dashboard/admin/teachers" className="text-sm font-bold text-brand-600 hover:text-brand-700">Lihat Semua</Link></div>
          <div className="p-4 flex flex-col flex-1">
            {recent.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">Belum ada pendaftar.</p> : recent.map(t => {
              const prof = t.profiles?.[0];
              const name = prof?.name || t.workspace_name || 'Unknown';
              const meta = prof?.email ? `${prof.email} · ${new Date(t.created_at).toLocaleDateString('id-ID')}` : undefined;
              const metaEmpty = !prof?.email ? `Email belum diisi · ${new Date(t.created_at).toLocaleDateString('id-ID')}` : undefined;
              return <ListRow key={t.id} name={name} meta={meta} metaEmpty={metaEmpty} badgeLabel={t.plan?.name ?? 'Free'} badgeVariant={t.status === 'ACTIVE' ? 'aktif' : 'default'} />;
            })}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50"><h2 className="text-lg font-bold text-slate-800">Distribusi Paket</h2></div>
          <div className="p-6 flex flex-col flex-1">
            <BarRow label="Free Tier" value={stats.freeCount} total={stats.totalTenants || 1} colorClass="bg-success-500" />
            <BarRow label="Pro" value={stats.proCount} total={stats.totalTenants || 1} colorClass="bg-brand-500" />
            <BarRow label="Enterprise" value={stats.enterpriseCount} total={stats.totalTenants || 1} colorClass="bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
