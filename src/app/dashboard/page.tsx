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
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} bg-opacity-10 border border-white/50 shadow-inner`}>
          <i className={`ti ${icon} text-[22px] ${iconColor}`} />
        </div>
        {trend && <div className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${trendPositive ? 'bg-success-50 text-success-600' : 'bg-slate-100 text-slate-500'}`}>{trend}</div>}
      </div>
      <div>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
type GridMenuCardProps = { icon: string; label: string; href: string; bgClass: string; iconClass: string };
function GridMenuCard({ icon, label, href, bgClass, iconClass }: GridMenuCardProps) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all active:scale-95 group">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bgClass} group-hover:scale-110 transition-transform shadow-inner`}>
        <i className={`ti ${icon} text-3xl ${iconClass}`} />
      </div>
      <span className="text-sm font-bold text-slate-700 text-center">{label}</span>
    </Link>
  );
}
type ActionItemProps = { iconBg: string; iconColor: string; icon: string; title: string; description: string; actionLabel: string; href?: string };
function ActionItem({ iconBg, iconColor, icon, title, description, actionLabel, href }: ActionItemProps) {
  return (
    <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-md transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <i className={`ti ${icon} text-[22px] ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-slate-800 mb-0.5">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {href ? <Link href={href} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm w-full sm:w-auto shrink-0 active:scale-95 text-center">{actionLabel}</Link> : <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm w-full sm:w-auto shrink-0 active:scale-95">{actionLabel}</button>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ activeStudents: 0, upcomingSessions: 0, pendingReports: 0, unpaidTotal: 0, overdueCount: 0, trialDaysLeft: null as number | null, tenantStatus: "" as string });
  const [todaySessions, setTodaySessions] = useState<{ id: string; subject: string; start_at: string; studentName: string }[]>([]);
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!cancelled && u) setUser({ email: u.email ?? undefined, user_metadata: u.user_metadata as Record<string,string> });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', session.user.id).single() as { data: { tenant_id: string } | null };
      const tenantId = profile?.tenant_id;
      if (!tenantId) { setLoading(false); return; }
      const { data: tenantRow } = await supabase.from('tenants').select('status, trial_end').eq('id', tenantId).single() as { data: { status: string; trial_end: string | null } | null };
      const trialDaysLeft = tenantRow?.trial_end ? Math.ceil((new Date(tenantRow.trial_end).getTime() - Date.now()) / 86400000) : null;
      const { count: activeStudents } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ACTIVE');
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
      const { count: upcomingSessions } = await supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('start_at', todayStart.toISOString()).lte('start_at', todayEnd.toISOString()).eq('status','SCHEDULED');
      const { count: pendingReports } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('published_at', null);
      const { data: unpaid } = await supabase.from('fees').select('amount, due_date').eq('tenant_id', tenantId).neq('status','PAID');
      const unpaidTotal = (unpaid as { amount: number }[] | null)?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
      const overdueCount = (unpaid as { due_date: string }[] | null)?.filter(r => r.due_date && new Date(r.due_date) < new Date(new Date().setHours(0,0,0,0))).length ?? 0;
      const { data: sessionsToday } = await supabase.from('sessions').select('id, subject, start_at, students(name)').eq('tenant_id', tenantId).gte('start_at', todayStart.toISOString()).lte('start_at', todayEnd.toISOString()).order('start_at').limit(5) as { data: Array<{ id: string; subject: string; start_at: string; students: { name: string } | null }> | null };
      if (!cancelled) {
        setStats({ activeStudents: activeStudents ?? 0, upcomingSessions: upcomingSessions ?? 0, pendingReports: pendingReports ?? 0, unpaidTotal, overdueCount, trialDaysLeft, tenantStatus: tenantRow?.status ?? "" });
        setTodaySessions((sessionsToday ?? []).map(s => ({ id: s.id, subject: s.subject, start_at: s.start_at, studentName: s.students?.name ?? '-' })));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Guru';

  return (
    <div className="space-y-6 sm:space-y-8">
      {stats.tenantStatus === 'TRIAL' && stats.trialDaysLeft !== null && (
        <div className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-4 border ${stats.trialDaysLeft <= 3 ? 'bg-danger-50 border-danger-200 text-danger-700' : 'bg-warning-50 border-warning-200 text-warning-700'}`}>
          <div className="flex items-center gap-3"><i className={`ti ${stats.trialDaysLeft <= 0 ? 'ti-alert-triangle' : 'ti-clock-hour-4'} text-xl`} /><div><div className="text-sm font-bold">{stats.trialDaysLeft <= 0 ? 'Trial berakhir' : `Trial tersisa ${stats.trialDaysLeft} hari`}</div><div className="text-xs opacity-80">Hubungi admin untuk aktivasi. Cron suspend berjalan harian.</div></div></div>
          <Link href="/dashboard/settings" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 whitespace-nowrap">Lihat Paket</Link>
        </div>
      )}
      {stats.overdueCount > 0 && (
        <div className="rounded-2xl px-5 py-4 bg-danger-50 border border-danger-200 text-danger-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><i className="ti ti-receipt-2 text-xl" /><div><div className="text-sm font-bold">{stats.overdueCount} tagihan overdue</div><div className="text-xs opacity-80">Segera follow-up WA.</div></div></div>
          <Link href="/dashboard/fees" className="px-4 py-2 bg-white border border-danger-200 rounded-xl text-xs font-bold">Lihat Tagihan</Link>
        </div>
      )}
      <div className="relative bg-gradient-to-r from-brand-900 via-brand-800 to-brand-600 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden shadow-lg shadow-brand-900/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-brand-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-brand-100 text-[11px] font-bold tracking-wide uppercase mb-3 backdrop-blur-sm">
            <i className="ti ti-sparkles text-brand-300" /> Teacher Panel
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Halo, {displayName}!</h1>
          <p className="text-brand-100 text-sm sm:text-base max-w-md">Siap mengajar hari ini? Pantau aktivitas dan perkembangan siswa Anda dengan mudah.</p>
        </div>
      </div>

      <div className="block md:hidden">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Menu Utama</h2>
        <div className="grid grid-cols-2 gap-4">
          <GridMenuCard icon="ti-users" label="Data Siswa" href="/dashboard/students" bgClass="bg-brand-50 border border-brand-100" iconClass="text-brand-600" />
          <GridMenuCard icon="ti-calendar-event" label="Jadwal Sesi" href="/dashboard/schedule" bgClass="bg-brand-50 border border-brand-100" iconClass="text-brand-600" />
          <GridMenuCard icon="ti-receipt" label="Tagihan" href="/dashboard/fees" bgClass="bg-brand-50 border border-brand-100" iconClass="text-brand-600" />
          <GridMenuCard icon="ti-settings" label="Pengaturan" href="/dashboard/settings" bgClass="bg-brand-50 border border-brand-100" iconClass="text-brand-600" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 md:hidden">Ringkasan</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard label="Siswa Aktif" value={loading ? "—" : stats.activeStudents} icon="ti-users" iconBg="bg-success-500" iconColor="text-success-600" />
          <StatCard label="Jadwal Hari Ini" value={loading ? "—" : stats.upcomingSessions} icon="ti-calendar-event" iconBg="bg-brand-500" iconColor="text-brand-600" />
          <StatCard label="Laporan Pending" value={loading ? "—" : stats.pendingReports} icon="ti-file-alert" iconBg="bg-danger-500" iconColor="text-danger-600" />
          <StatCard label="Tagihan Tertunda" value={loading ? "—" : formatRupiah(stats.unpaidTotal)} icon="ti-cash" iconBg="bg-warning-500" iconColor="text-warning-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Jadwal Hari Ini</h2>
            <Link href="/dashboard/schedule" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">Lihat Semua</Link>
          </div>
          <div className="p-6 flex flex-col flex-1 min-h-[250px]">
            {loading ? <div className="flex flex-col gap-3 animate-pulse"><div className="h-12 bg-slate-100 rounded-xl" /><div className="h-12 bg-slate-100 rounded-xl" /></div>
            : todaySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"><i className="ti ti-calendar-off text-3xl text-slate-300" /></div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Hari yang Kosong</h3>
                <p className="text-slate-500 text-sm max-w-[250px]">Anda tidak memiliki jadwal mengajar untuk hari ini. Waktunya bersantai!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {todaySessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div><div className="text-sm font-bold text-slate-800">{s.studentName}</div><div className="text-xs text-slate-500">{s.subject} · {new Date(s.start_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div></div>
                    <i className="ti ti-chevron-right text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50"><h2 className="text-lg font-bold text-slate-800">Perlu Tindakan</h2></div>
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            {stats.pendingReports > 0 && <ActionItem iconBg="bg-danger-500" iconColor="text-danger-600" icon="ti-clock-exclamation" title={`${stats.pendingReports} Laporan Tertunda`} description="Isi laporan progres untuk sesi sebelumnya agar orang tua dapat memantau." actionLabel="Tinjau Sekarang" href="/dashboard/schedule" />}
            {stats.upcomingSessions === 0 && stats.pendingReports === 0 && !loading ? <p className="text-sm text-slate-500 text-center py-8">Semua beres — tidak ada tindakan tertunda.</p> : null}
            {stats.pendingReports === 0 && stats.upcomingSessions > 0 ? <ActionItem iconBg="bg-brand-500" iconColor="text-brand-600" icon="ti-calendar-check" title="Jadwal menanti" description={`${stats.upcomingSessions} sesi terjadwal hari ini.`} actionLabel="Lihat Jadwal" href="/dashboard/schedule" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
