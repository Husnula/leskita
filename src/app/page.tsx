"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans">

      {/* Left Panel - Branding & Visuals */}
      <div className="hidden md:flex md:w-1/2 bg-brand-900 relative overflow-hidden items-center justify-center p-12">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-8 border border-white/20">
            <span className="text-3xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">L</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Kelola lembaga les Anda dengan lebih <span className="text-brand-300">profesional.</span>
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed mb-8">
            Platform SaaS lengkap untuk manajemen jadwal, tagihan, dan absensi siswa dalam satu tempat yang terintegrasi.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1,2,3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-900 bg-brand-200 flex items-center justify-center overflow-hidden">
                   <i className="ti ti-user text-brand-600"></i>
                </div>
              ))}
            </div>
            <div className="text-sm font-medium text-brand-200">
              Dipercaya oleh 100+ lembaga
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-lg font-bold text-white">L</span>
            </div>
            <span className="text-xl font-bold text-slate-900">LesKita</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat datang kembali</h2>
            <p className="text-slate-500">Masukkan kredensial Anda untuk mengakses dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger-50 border border-danger-500/20 flex items-start gap-3">
              <i className="ti ti-alert-circle text-danger-500 mt-0.5"></i>
              <p className="text-sm font-medium text-danger-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Alamat Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ti ti-mail text-slate-400 text-lg"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="/forgot" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  Lupa password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ti ti-lock text-slate-400 text-lg"></i>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <i className="ti ti-loader-2 animate-spin text-lg"></i>
              ) : (
                <>
                  Masuk ke Dashboard
                  <i className="ti ti-arrow-right text-lg"></i>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            Belum punya akun?{" "}
            <a href="#" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
              Hubungi Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
