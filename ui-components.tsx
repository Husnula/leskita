/**
 * LesKita — Shared UI Components
 * ================================
 * WAJIB DIBACA sebelum menulis UI baru.
 * Semua komponen di sini sudah sesuai DESIGN_SYSTEM.md.
 * Jangan buat class atau warna baru — pakai yang ada di sini.
 *
 * Import contoh:
 *   import { Card, Badge, Button, StatCard, Avatar } from "@/components/ui";
 */

import React from "react";

// ─────────────────────────────────────────────
// DESIGN TOKENS (referensi cepat)
// Jangan hardcode hex — pakai Tailwind token di bawah ini
// ─────────────────────────────────────────────
//
// Background  : bg-surf (#f5f6f8)  bg-card (#fff)  bg-side (#0f1117)
// Teks        : text-ink (#0f1117)  text-ink-2 (#4a5060)  text-ink-3 (#9299a8)
// Border      : border-border (#e5e7eb)  border-border-dk (#2a3347)
// Aksen hijau : bg-green (#22c55e)  bg-green-bg (#f0fdf4)  text-green-txt (#166534)
// Aksen merah : bg-red (#ef4444)    bg-red-bg (#fef2f2)    text-red-txt (#991b1b)
// Aksen ungu  : bg-purple (#8b5cf6) bg-purple-bg (#f5f3ff) text-purple-txt (#5b21b6)
// Sidebar     : bg-side-2 (#1c2030)  bg-side-3 (#262d3d)  text-side-text (#c8cdd8)


// ─────────────────────────────────────────────
// 1. CARD
// Wrapper putih standar untuk semua panel & konten.
// ─────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "normal" | "plan"; // normal = 16px 18px, plan = 22px
}

export function Card({ children, className = "", padding = "normal" }: CardProps) {
  const paddingClass = padding === "plan" ? "p-[22px]" : "p-[18px]";
  return (
    <div className={`bg-card border border-border rounded-[12px] ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}


// ─────────────────────────────────────────────
// 2. BADGE / PILL
// Untuk status guru, tier plan, label kategori.
// ─────────────────────────────────────────────
type BadgeVariant = "aktif" | "free" | "pro" | "enterprise" | "warning";

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  dot?: boolean; // tampilkan dot hijau (hanya untuk variant "aktif")
}

const badgeStyles: Record<BadgeVariant, string> = {
  aktif:      "bg-green-bg text-green-txt",
  free:       "bg-surf text-ink-3",
  pro:        "bg-purple-bg text-purple-txt",
  enterprise: "bg-[#0f1117] text-white",
  warning:    "bg-[#fffbeb] text-[#92400e]",
};

export function Badge({ variant = "free", label, dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeStyles[variant]}`}
    >
      {dot && variant === "aktif" && (
        <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
      )}
      {label}
    </span>
  );
}


// ─────────────────────────────────────────────
// 3. BUTTON
// Tiga varian utama sesuai DESIGN_SYSTEM.md.
// ─────────────────────────────────────────────
type ButtonVariant = "dark" | "solid" | "outline" | "danger" | "ghost";
type ButtonSize    = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const buttonVariantStyles: Record<ButtonVariant, string> = {
  dark:    "bg-ink text-white hover:bg-side-2",
  solid:   "bg-green text-white hover:bg-green-dk",
  outline: "bg-surf border border-border text-ink hover:border-ink-3 hover:bg-[#f0f0f0]",
  danger:  "bg-red-bg border border-[#fca5a5] text-red-txt hover:bg-[#fee2e2]",
  ghost:   "bg-transparent text-ink-2 hover:bg-surf hover:text-ink",
};

const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: "text-[12px] px-3 py-1.5 rounded-[6px] gap-1.5",
  md: "text-[13px] px-4 py-2 rounded-[9px] gap-2",
};

export function Button({
  variant = "outline",
  size = "md",
  icon,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center font-medium transition-colors ${buttonVariantStyles[variant]} ${buttonSizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}


// ─────────────────────────────────────────────
// 4. AVATAR
// Lingkaran inisial untuk guru / user.
// ─────────────────────────────────────────────
type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  name?: string;      // jika ada → hijau, tampilkan inisial
  size?: AvatarSize;
}

const avatarSizeStyles: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-[12px]",
  md: "w-10 h-10 text-[14px]",
  lg: "w-12 h-12 text-[16px]",
};

export function Avatar({ name, size = "md" }: AvatarProps) {
  const hasName = name && name.trim().length > 0 && name !== "Unknown";
  const initial = hasName ? name!.charAt(0).toUpperCase() : "?";
  const colorClass = hasName
    ? "bg-green-bg text-green-txt"
    : "bg-surf text-ink-3";

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold shrink-0 ${avatarSizeStyles[size]} ${colorClass}`}
    >
      {initial}
    </div>
  );
}


// ─────────────────────────────────────────────
// 5. STAT CARD
// Card metrik di dashboard — angka besar + label + ikon.
// Grid: gunakan grid-cols-4 gap-3 di parent.
// ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;           // contoh: "↑ 2 bulan ini" atau "100% aktif"
  trendPositive?: boolean;  // hijau jika true, abu jika false/undefined
  icon: React.ReactNode;
  iconBg?: string;          // Tailwind bg class, contoh: "bg-green-bg"
  iconColor?: string;       // Tailwind text class, contoh: "text-green-txt"
}

export function StatCard({
  label,
  value,
  trend,
  trendPositive,
  icon,
  iconBg = "bg-surf",
  iconColor = "text-ink-3",
}: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-[12px] p-[18px]">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-3">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="text-[26px] font-bold text-ink leading-none mb-1">{value}</div>
      {trend && (
        <div className={`text-[11px] ${trendPositive ? "text-green-txt" : "text-ink-3"}`}>
          {trend}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// 6. PANEL HEADER
// Header standar untuk semua panel/card berisi daftar.
// ─────────────────────────────────────────────
interface PanelHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PanelHeader({ title, actionLabel, onAction }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[13px] font-semibold text-ink">{title}</span>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-[11px] text-blue hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// 7. LIST ROW
// Baris item dalam panel — avatar + nama + meta + badge.
// ─────────────────────────────────────────────
interface ListRowProps {
  name: string;
  meta?: string;          // email, tanggal, dsb
  metaEmpty?: string;     // teks jika meta kosong, contoh: "Email belum diisi"
  badge?: React.ReactNode;
  isLast?: boolean;
}

export function ListRow({ name, meta, metaEmpty, badge, isLast = false }: ListRowProps) {
  return (
    <div className={`flex items-center gap-3 py-2 ${!isLast ? "border-b border-border" : ""}`}>
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">{name}</div>
        {meta ? (
          <div className="text-[11px] text-ink-3 truncate">{meta}</div>
        ) : metaEmpty ? (
          <div className="text-[11px] text-[#d1d5db] italic truncate">{metaEmpty}</div>
        ) : null}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}


// ─────────────────────────────────────────────
// 8. TEACHER CARD
// Card guru di halaman Kelola Guru.
// Grid: gunakan grid-cols-3 gap-3 di parent.
// ─────────────────────────────────────────────
interface TeacherCardProps {
  name: string;
  email?: string;
  workspace?: string;
  plan?: "Free" | "Pro" | "Enterprise";
  joinDate?: string;
  isActive?: boolean;
  onEdit?: () => void;
  onMessage?: () => void;
  onDelete?: () => void;
}

export function TeacherCard({
  name,
  email,
  workspace,
  plan = "Free",
  joinDate,
  isActive = true,
  onEdit,
  onMessage,
  onDelete,
}: TeacherCardProps) {
  const planVariant: Record<string, BadgeVariant> = {
    Free: "free", Pro: "pro", Enterprise: "enterprise",
  };

  return (
    <div className="bg-card border border-border rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={name} size="md" />
            <div>
              <div className="text-[14px] font-semibold text-ink">{name}</div>
              {workspace && (
                <div className="text-[11px] text-ink-3">{workspace}</div>
              )}
            </div>
          </div>
          <Badge variant={isActive ? "aktif" : "free"} label={isActive ? "Aktif" : "Nonaktif"} dot={isActive} />
        </div>

        {/* Info rows */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[12px] text-ink-2">
            <i className="ti ti-package text-[13px] text-ink-3" />
            <Badge variant={planVariant[plan]} label={`${plan} Tier`} />
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <i className="ti ti-mail text-[13px] text-ink-3" />
            {email ? (
              <span className="text-ink-2 truncate">{email}</span>
            ) : (
              <span className="text-[#d1d5db] italic">Email belum diisi</span>
            )}
          </div>
          {joinDate && (
            <div className="flex items-center gap-2 text-[12px] text-ink-3">
              <i className="ti ti-calendar text-[13px]" />
              <span>Bergabung {joinDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex border-t border-border">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-ink-2 bg-surf hover:bg-[#f0f0f0] transition-colors"
        >
          <i className="ti ti-edit text-[13px]" />
          Edit
        </button>
        <button
          onClick={onMessage}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-ink-2 bg-surf hover:bg-[#f0f0f0] border-l border-border transition-colors"
        >
          <i className="ti ti-message text-[13px]" />
          Pesan
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center px-3.5 py-2.5 text-red-txt bg-red-bg hover:bg-[#fee2e2] border-l border-[#fca5a5] transition-colors"
        >
          <i className="ti ti-trash text-[13px]" />
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// 9. PLAN CARD
// Card paket langganan. Grid: grid-cols-3 gap-4.
// ─────────────────────────────────────────────
interface PlanFeature {
  label: string;
  available: boolean;
}

type PlanCTA = "outline" | "solid" | "dark";

interface PlanCardProps {
  name: string;
  price: string;        // contoh: "Rp 0" atau "Rp 9.000"
  period?: string;      // contoh: "/bulan"
  features: PlanFeature[];
  ctaLabel: string;
  ctaVariant?: PlanCTA;
  featured?: boolean;   // Pro — border hijau 2px + badge "Terpopuler"
  onSelect?: () => void;
}

export function PlanCard({
  name,
  price,
  period = "/bulan",
  features,
  ctaLabel,
  ctaVariant = "outline",
  featured = false,
  onSelect,
}: PlanCardProps) {
  const ctaStyles: Record<PlanCTA, string> = {
    outline: "border border-border bg-transparent text-ink hover:border-ink-3",
    solid:   "bg-green text-white hover:bg-green-dk",
    dark:    "bg-ink text-white hover:bg-side-2",
  };

  return (
    <div
      className={`relative bg-card rounded-[14px] p-[22px] ${
        featured
          ? "border-[2px] border-green"
          : "border border-border"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-green text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Terpopuler
          </span>
        </div>
      )}

      <div className="mb-4">
        <div className="text-[13px] font-semibold text-ink mb-1">{name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[24px] font-bold text-ink">{price}</span>
          <span className="text-[12px] text-ink-3">{period}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            {f.available ? (
              <i className="ti ti-check text-green text-[14px] shrink-0" />
            ) : (
              <i className="ti ti-x text-ink-3 text-[14px] shrink-0" />
            )}
            <span className={f.available ? "text-ink-2" : "text-ink-3"}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onSelect}
        className={`w-full py-2.5 rounded-[9px] text-[13px] font-semibold transition-colors ${ctaStyles[ctaVariant]}`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────
// 10. BAR CHART ROW
// Baris distribusi paket (panel kanan dashboard admin).
// ─────────────────────────────────────────────
interface BarRowProps {
  label: string;
  value: number;    // angka aktual
  total: number;    // untuk hitung persentase
  color?: string;   // Tailwind bg class, default: "bg-green"
  unit?: string;    // contoh: "akun"
}

export function BarRow({ label, value, total, color = "bg-green", unit = "akun" }: BarRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5 py-2 border-b border-border last:border-0">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-semibold text-ink">{value} {unit}</span>
      </div>
      <div className="h-1.5 bg-surf rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// 11. FILTER CHIP
// Untuk filter bar di halaman Kelola Guru.
// ─────────────────────────────────────────────
interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-card text-ink-2 border-border hover:border-ink-3"
      }`}
    >
      {label}
    </button>
  );
}


// ─────────────────────────────────────────────
// 12. EMPTY STATE
// Tampilkan saat data kosong — selalu beri konteks.
// ─────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 opacity-60">
      {icon && (
        <div className="text-ink-3 text-[24px]">{icon}</div>
      )}
      <p className="text-[12px] text-ink-3 text-center max-w-[200px]">{message}</p>
    </div>
  );
}


// ─────────────────────────────────────────────
// 13. ALERT / TOAST
// Notifikasi error atau sukses dalam form / halaman.
// ─────────────────────────────────────────────
type AlertVariant = "error" | "success";

interface AlertProps {
  variant: AlertVariant;
  message: string;
}

const alertStyles: Record<AlertVariant, string> = {
  error:   "bg-red-bg border-[#fca5a5] text-red-txt",
  success: "bg-green-bg border-[#86efac] text-green-txt",
};

export function Alert({ variant, message }: AlertProps) {
  const icon = variant === "error"
    ? <i className="ti ti-alert-circle text-[16px] shrink-0 mt-0.5" />
    : <i className="ti ti-circle-check text-[16px] shrink-0 mt-0.5" />;

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-[13px] ${alertStyles[variant]}`}>
      {icon}
      <span>{message}</span>
    </div>
  );
}
