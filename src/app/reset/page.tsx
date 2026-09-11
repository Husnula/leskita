"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setErr("Password minimal 8 karakter.");
    if (password !== confirm) return setErr("Konfirmasi tidak cocok.");
    setLoading(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setErr(error.message);
    else { setMsg("Password diperbarui! Mengalihkan..."); setTimeout(()=>router.push("/"), 1200); }
  };
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6">L</div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Atur password baru</h1>
        <p className="text-sm text-slate-500 mt-1">Buka link dari email, lalu atur password baru.</p>
        {err && <div className="mt-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">{err}</div>}
        {msg && <div className="mt-4 p-3 rounded-xl bg-success-50 border border-success-200 text-sm text-success-700">{msg}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password baru (min 8)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none" />
          <input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Konfirmasi password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none" />
          <button type="submit" disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-lock" />}Simpan password</button>
        </form>
      </div>
    </div>
  );
}
