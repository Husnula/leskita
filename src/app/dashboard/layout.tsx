"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CommandPalette } from "@/components/CommandPalette";
import dayjs from "dayjs";
type NotifItem = { id: string; title: string; desc: string; time: string; read?: boolean };
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [role, setRole] = useState<string>("TEACHER");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dynamicCmdItems, setDynamicCmdItems] = useState<{ label: string; href: string; keywords?: string }[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const fetchNotifs = useCallback(async (tenantId: string) => {
    const items: NotifItem[] = [];
    const { data: recentStudents } = await supabase.from('students').select('id, name, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(3) as { data: { id: string; name: string; created_at: string }[] | null };
    (recentStudents ?? []).forEach(s => items.push({ id: s.id, title: `Siswa baru: ${s.name}`, desc: `Daftar ${dayjs(s.created_at).format('DD MMM')}`, time: s.created_at }));
    const { data: overdue } = await supabase.from('fees').select('id, period, due_date, amount, students(name)').eq('tenant_id', tenantId).neq('status','PAID').limit(5) as { data: { id: string; period: string; due_date: string; students: { name: string } | null }[] | null };
    (overdue ?? []).forEach(f => {
      if (dayjs(f.due_date).isBefore(dayjs(), 'day')) items.push({ id: f.id, title: `Overdue: ${f.students?.name ?? '-'}`, desc: `Periode ${f.period} lewat jatuh tempo`, time: f.due_date });
    });
    const { count: pendingReports } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('published_at', null);
    if (pendingReports && pendingReports > 0) items.push({ id: 'reports-pending', title: `${pendingReports} laporan draft`, desc: 'Publish agar wali melihat', time: new Date().toISOString() });
    items.sort((a,b)=> new Date(b.time).getTime() - new Date(a.time).getTime());
    setNotifs(items.slice(0,10));
    setNotifCount(items.length);
  }, []);
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      setUser({ id: session.user.id, email: session.user.email });
      const { data: profile } = await supabase.from('profiles').select('*, tenants(*)').eq('id', session.user.id).single() as { data: { tenant_id: string; role: string; tenants: { workspace_name: string } | null } | null };
      if (profile?.role) {
        setRole(profile.role);
        if (profile.role === 'ADMIN' && pathname === '/dashboard') router.push('/dashboard/admin');
        if (profile.role !== 'ADMIN' && profile.tenant_id) {
          fetchNotifs(profile.tenant_id);
          const { data: studs } = await supabase.from('students').select('id, name').eq('tenant_id', profile.tenant_id).limit(20) as { data: { id: string; name: string }[] | null };
          setDynamicCmdItems((studs ?? []).map(s=>({ label: s.name, href: `/dashboard/students`, keywords: s.name })));
        }
      }
      if (!profile) {
        const { data: tenant } = await supabase.from('tenants').insert({ teacher_user_id: session.user.id, workspace_name: `Workspace ${session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Guru'}`, status: 'ACTIVE' } as never).select().single() as { data: { id: string } | null };
        if (tenant) {
          await supabase.from('profiles').insert({ id: session.user.id, tenant_id: tenant.id, name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0], role: 'TEACHER' } as never);
          setRole('TEACHER');
        }
      }
      setLoading(false);
    };
    checkSession();
  }, [router, pathname, fetchNotifs]);
  useEffect(() => {
    if (!user || role === 'ADMIN') return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single() as { data: { tenant_id: string } | null };
      if (profile?.tenant_id) {
        channel = supabase.channel(`rk-${profile.tenant_id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `tenant_id=eq.${profile.tenant_id}` }, () => { setNotifCount(c=>c+1); fetchNotifs(profile.tenant_id); })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fees', filter: `tenant_id=eq.${profile.tenant_id}` }, () => { setNotifCount(c=>c+1); fetchNotifs(profile.tenant_id); })
          .subscribe();
      }
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user, role, fetchNotifs]);
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); setCmdOpen(v=>!v); } };
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  }, []);
  if (loading) return <div className="flex h-screen items-center justify-center bg-surface"><div className="flex flex-col items-center gap-4 animate-fade-in-up"><div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100"><span className="text-xl font-bold bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent">L</span></div><div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" /><div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay:'150ms'}} /><div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay:'300ms'}} /></div></div></div>;
  const teacherMenuItems = [
    { icon: "ti-layout-dashboard", label: "Home", href: "/dashboard" },
    { icon: "ti-users", label: "Siswa", href: "/dashboard/students" },
    { icon: "ti-category", label: "Kelas", href: "/dashboard/classes" },
    { icon: "ti-calendar", label: "Jadwal", href: "/dashboard/schedule" },
    { icon: "ti-clipboard-check", label: "Absensi", href: "/dashboard/attendance" },
    { icon: "ti-file-analytics", label: "Laporan", href: "/dashboard/reports" },
    { icon: "ti-file-invoice", label: "Tagihan", href: "/dashboard/fees" },
    { icon: "ti-settings", label: "Akun", href: "/dashboard/settings" },
  ];
  const adminMenuItems = [
    { icon: "ti-layout-dashboard", label: "Overview", href: "/dashboard/admin" },
    { icon: "ti-chalkboard", label: "Guru", href: "/dashboard/admin/teachers" },
    { icon: "ti-package", label: "Paket", href: "/dashboard/admin/plans" },
    { icon: "ti-history", label: "Audit", href: "/dashboard/admin/audit" },
  ];
  const activeMenuItems = role === 'ADMIN' ? adminMenuItems : teacherMenuItems;
  return (
    <div className="flex flex-col md:flex-row h-screen bg-surface font-sans text-[14px]">
      <aside className="hidden md:flex w-[260px] shrink-0 bg-slate-950 flex-col h-screen overflow-y-auto relative z-20">
        <div className="px-6 py-8 flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">L</div><div><div className="text-xl font-bold text-white tracking-tight">LesKita</div><div className="text-xs text-brand-300/80 font-medium tracking-wide">{role === 'ADMIN' ? 'SUPER ADMIN' : 'TEACHER PANEL'}</div></div></div>
        <nav className="px-4 py-2 flex-1 flex flex-col gap-1.5"><div className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase px-2 mb-2 mt-4">Main Menu</div>{activeMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return <Link key={item.href} href={item.href} className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[14px] font-medium transition-all group relative overflow-hidden ${isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-brand-500 rounded-r-full" />}<i className={`ti ${item.icon} text-[20px] ${isActive ? 'text-brand-400' : 'group-hover:scale-110'}`} /><span className="truncate">{item.label}</span></Link>;
        })}</nav>
        <div className="p-4 mt-auto"><div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[15px] font-bold text-white border border-white/10">{user?.email?.charAt(0).toUpperCase() || 'U'}</div><div className="flex flex-col min-w-0 flex-1"><div className="text-[13px] text-white font-semibold truncate">{user?.email?.split('@')[0] || 'User'}</div><div className="text-[11px] text-slate-400 truncate">{user?.email}</div></div></div></div>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex items-center justify-around px-2 pb-safe pt-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {activeMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl ${isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}><i className={`ti ${item.icon} text-[22px] ${isActive ? 'scale-110' : ''}`} /><span className={`text-[10px] font-semibold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span></Link>;
        })}
      </nav>
      <div className="flex-1 flex flex-col overflow-hidden h-screen min-w-0 bg-surface">
        <header className="h-[64px] md:h-[76px] bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-8 gap-4 md:gap-6 shrink-0 sticky top-0 z-10">
          <div className="flex md:hidden items-center gap-2 mr-auto"><div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div><div className="text-lg font-bold text-slate-800 tracking-tight">LesKita</div></div>
          <button onClick={()=>setCmdOpen(true)} className="hidden md:flex items-center gap-3 bg-slate-100 hover:bg-slate-200/70 border border-transparent focus-within:bg-white focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 rounded-xl py-2.5 px-4 flex-1 max-w-[400px] text-left transition-all"><i className="ti ti-search text-[18px] text-slate-400" /><span className="text-[14px] text-slate-400 font-medium">Cari siswa, tagihan...</span><span className="ml-auto hidden sm:flex items-center gap-1 opacity-50"><kbd className="text-[10px] px-1.5 py-0.5 rounded-md border border-slate-300 bg-white">Ctrl</kbd><kbd className="text-[10px] px-1.5 py-0.5 rounded-md border border-slate-300 bg-white">K</kbd></span></button>
          <div className="ml-auto flex items-center gap-1 md:gap-3">
            <Link href="/parent" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"><i className="ti ti-users" />Parent</Link>
            <div className="relative">
              <button onClick={()=>setNotifOpen(v=>!v)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 relative"><i className="ti ti-bell text-[22px]" />{notifCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger-500 border-2 border-white rounded-full" />}</button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><span className="text-sm font-bold text-slate-800">Notifikasi</span><button onClick={()=>{setNotifCount(0); setNotifOpen(false);}} className="text-xs font-bold text-brand-600">Tandai dibaca</button></div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length===0 ? <p className="text-sm text-slate-500 text-center py-10">Tidak ada notifikasi.</p> : notifs.map(n=>(
                      <div key={n.id} className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <div className="text-sm font-bold text-slate-800 truncate">{n.title}</div><div className="text-xs text-slate-500">{n.desc}</div><div className="text-[11px] text-slate-400 mt-1">{dayjs(n.time).format('DD MMM HH:mm')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden md:block w-[1px] h-6 bg-slate-200 mx-1" />
            <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-danger-600 hover:bg-danger-50"><i className="ti ti-logout text-lg" />Keluar</button>
            <button onClick={handleLogout} className="flex md:hidden w-8 h-8 rounded-full bg-slate-200 items-center justify-center text-[13px] font-bold text-slate-600 border border-slate-300 ml-1">{user?.email?.charAt(0).toUpperCase() || 'U'}</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 max-w-7xl mx-auto h-full animate-fade-in-up">{children}</div>
        </main>
      </div>
      <CommandPalette dynamicItems={dynamicCmdItems} open={cmdOpen} onClose={()=>setCmdOpen(false)} />
      {notifOpen && <div className="fixed inset-0 z-10" onClick={()=>setNotifOpen(false)} />}
    </div>
  );
}
