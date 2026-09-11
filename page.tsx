"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) {
          setSuccess("Pendaftaran berhasil! Mengarahkan ke dashboard...");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setSuccess("Periksa email kamu untuk verifikasi, lalu masuk.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[#0f1117]">

      {/* ── KIRI: Brand panel ── */}
      <div className="relative hidden lg:flex w-[420px] shrink-0 flex-col justify-between bg-[#0f1117] px-11 py-12 overflow-hidden">

        {/* Glow dekoratif — satu-satunya aksen warna di panel ini */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 w-80 h-80"
          style={{
            background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo + tagline */}
        <div className="relative z-10">
          <div className="mb-12 w-11 h-11 bg-[#22c55e] rounded-xl flex items-center justify-center text-white text-xl font-bold">
            L
          </div>
          <h1 className="text-[30px] font-bold text-white leading-tight tracking-tight mb-4">
            Kelola les lebih{" "}
            <span className="text-[#22c55e]">rapi</span>,<br />
            lebih profesional.
          </h1>
          <p className="text-[15px] text-[#c8cdd8] leading-relaxed max-w-[280px]">
            Satu platform untuk absensi, jadwal, tagihan, dan laporan bimbel kamu.
          </p>
        </div>

        {/* Stat cards */}
        <div className="relative z-10 flex flex-col gap-3">
          {[
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              label: "Dipakai oleh",
              value: "Guru & bimbel seluruh Indonesia",
            },
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
              label: "Fitur lengkap",
              value: "Jadwal, tagihan, absensi, laporan",
            },
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              ),
              label: "Gratis mulai dari",
              value: "Free Tier — daftar sekarang",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-4 rounded-xl border border-[#2a3347] bg-[#1c2030]"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-[rgba(34,197,94,0.1)] flex items-center justify-center text-[#22c55e]">
                {item.icon}
              </div>
              <div>
                <div className="text-[11px] text-[#9299a8]">{item.label}</div>
                <div className="text-[14px] font-semibold text-white">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KANAN: Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f5f6f8]">
        <div className="w-full max-w-[400px] bg-white rounded-[20px] border border-[#e5e7eb] p-10">

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#991b1b]">
              <svg className="mt-0.5 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#86efac] bg-[#f0fdf4] px-4 py-3 text-[13px] text-[#166534]">
              <svg className="mt-0.5 shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}

          <h1 className="text-[20px] font-bold text-[#0f1117] mb-1">
            {isLogin ? "Masuk ke akunmu" : "Buat akun baru"}
          </h1>
          <p className="text-[13px] text-[#9299a8] mb-8">
            {isLogin ? "Selamat datang kembali di LesKita." : "Mulai gratis, tidak perlu kartu kredit."}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">

            {/* Nama — hanya tampil saat daftar */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#0f1117]">
                  Nama lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budi Santoso"
                  required={!isLogin}
                  className="w-full rounded-[10px] border border-[#e5e7eb] bg-[#f5f6f8] px-3.5 py-[11px] text-[14px] text-[#0f1117] placeholder:text-[#c4c8d0] outline-none focus:border-[#9299a8] focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#0f1117]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full rounded-[10px] border border-[#e5e7eb] bg-[#f5f6f8] px-3.5 py-[11px] text-[14px] text-[#0f1117] placeholder:text-[#c4c8d0] outline-none focus:border-[#9299a8] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[#0f1117]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-[10px] border border-[#e5e7eb] bg-[#f5f6f8] px-3.5 py-[11px] text-[14px] text-[#0f1117] placeholder:text-[#c4c8d0] outline-none focus:border-[#9299a8] focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={[
                "mt-2 flex w-full items-center justify-center gap-2 rounded-[11px] py-[13px] text-[14px] font-semibold text-white transition-colors",
                isLogin
                  ? "bg-[#0f1117] hover:bg-[#1c2030]"
                  : "bg-[#22c55e] hover:bg-[#15803d]",
              ].join(" ")}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Memproses...
                </>
              ) : isLogin ? (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Masuk
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Daftar sekarang
                </>
              )}
            </button>
          </form>

          {/* Divider + toggle */}
          <div className="mt-6 border-t border-[#e5e7eb] pt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
              className="text-[13px] text-[#9299a8] hover:text-[#0f1117] transition-colors"
            >
              {isLogin ? (
                <>Belum punya akun? <span className="font-semibold text-[#0f1117] underline underline-offset-2">Daftar gratis</span></>
              ) : (
                <>Sudah punya akun? <span className="font-semibold text-[#0f1117] underline underline-offset-2">Masuk</span></>
              )}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
