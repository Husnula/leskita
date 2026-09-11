"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` });
    setLoading(false);
    if (error) setErr(error.message);
    else setMsg("Link reset dikirim ke email. Cek inbox/spam.");
  };
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6">L</div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lupa password</h1>
        <p className="text-sm text-slate-500 mt-1">Masukkan email akun. Kami kirim link reset via Supabase Auth.</p>
        {err && <div className="mt-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">{err}</div>}
        {msg && <div className="mt-4 p-3 rounded-xl bg-success-50 border border-success-200 text-sm text-success-700">{msg}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 outline-none" />
          <button type="submit" disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-mail-forward" />}Kirim link reset</button>
        </form>
        <div className="mt-6 flex justify-between text-sm"><Link href="/" className="font-bold text-brand-600">Kembali login</Link><Link href="/reset" className="text-slate-500">Sudah punya link?</Link></div>
      </div>
    </div>
  );
}
