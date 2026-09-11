# LesKita — Map Penyempurnaan Aplikasi

> Tujuan: SaaS manajemen les (teacher multi-tenant + admin console). Tenant = guru/workspace. Status sekarang: MVP frontend jalan, DB lengkap, banyak mock/hardcode, belum production-ready.

---

## 1. Snapshot Saat Ini

| Lapisan | Ada | Kondisi |
|---|---|---|
| **Auth** | Supabase Auth (`signInWithPassword`) | Client-only, tanpa middleware, redirect logic di `dashboard/layout.tsx` |
| **DB Schema** | 11 tabel + RLS + helper `get_my_tenant_id()` / `is_admin()` | Lengkap di `supabase/schema.sql`, belum migrasi versioned, FK tanpa CASCADE |
| **Roles** | `ADMIN` / `TEACHER` / `PARENT` di `profiles.role` | `PARENT` belum dipakai di UI |
| **Teacher UI** | Dashboard, Students, Schedule, Fees, Settings | CRUD jalan, sebagian masih `any`, `alert/confirm` native, tanpa edit/pagination |
| **Admin UI** | Overview, Kelola Guru, Paket Langganan | Overview stat real tapi `Pendaftar Terbaru` hardcode, `Estimasi MRR` placeholder |
| **Billing** | `plans` + `fees` + `InvoiceDocument` PDF | Invoice_no random, tanpa webhook payment gateway |
| **Design System** | `DESIGN_SYSTEM.md` (#22c55e green) | Tidak sinkron dengan `globals.css` (#715A5A rose) — sumber bug visual |
| **Realtime** | Subscribe `students` INSERT di layout | Hanya bell dot, tanpa daftar notifikasi |
| **Infra** | Next 16.3, Tailwind 4, Supabase JS, react-pdf | `.env.local` berisi service_role key ter-commit (risiko) |

### Struktur File Existing
```
src/app/page.tsx                    → LoginPage (client)
src/app/layout.tsx                  → RootLayout + Tabler CDN
src/app/dashboard/layout.tsx        → Auth guard + sidebar + topbar + realtime
src/app/dashboard/page.tsx          → Teacher Home (stat mock setTimeout)
src/app/dashboard/students/page.tsx → CRUD Students
src/app/dashboard/schedule/page.tsx → Calendar + sessions
src/app/dashboard/fees/page.tsx     → Tagihan + auto-generate + WA + PDF
src/app/dashboard/settings/page.tsx → Tabs profile/workspace/billing (mock)
src/app/dashboard/admin/page.tsx    → Admin Overview (hardcode ListRow)
src/app/dashboard/admin/teachers/   → CRUD Tenants via server action
src/app/dashboard/admin/plans/      → CRUD Plans
src/lib/supabase.ts                 → createClient anon
src/app/actions/admin.ts            → createTenantManual / deleteTenantManual (service_role)
src/components/InvoiceDocument.tsx  → PDF
src/components/MetricCard.tsx       → Tidak terpakai (stitch_app_ui_redesign.zip?)
supabase/schema.sql                 → Single file, tanpa migrations
```

---

## 2. Gap Matrix — Fitur vs Status

| Modul | DB Ready | UI | Logika | Prioritas |
|---|---|---|---|---|
| **Auth: middleware + SSR** | ✅ | ⚠️ client only | ❌ tanpa `middleware.ts`, tanpa refresh token | **P0** |
| **Onboarding wizard** (buat tenant otomatis) | ✅ | ❌ alert di layout | ❌ race condition | P0 |
| **Students** | ✅ | ✅ tabel | ⚠️ tanpa edit, tanpa status toggle, tanpa validasi phone/email | P0 |
| **Classes + Class Members** | ✅ | ❌ belum ada page | ❌ — | **P1** |
| **Sessions / Schedule** | ✅ | ✅ | ⚠️ tanpa edit/hapus wiring, tanpa recurring, tanpa filter tenant di fetch students | P0 |
| **Attendance** | ✅ | ❌ belum ada UI | ❌ — | **P1** |
| **Reports (progres/harian)** | ✅ | ❌ belum ada UI | ❌ — | P1 |
| **Fees: generate + bayar** | ✅ | ✅ | ⚠️ invoice_no collision, tanpa partial payment, tanpa filter overdue | P0 |
| **Payment instructions / Settings** | ✅ `teacher_settings` | ❌ settings tidak baca/tulis ke tabel | ❌ | P1 |
| **WhatsApp notifikasi** | ❌ | WA link `wa.me` | ❌ tanpa template, tanpa provider (WA Gateway) | P1 |
| **Parent Portal** | ✅ RLS `parent_email` | ❌ belum ada route | ❌ | P2 |
| **Admin: metrics real** | ✅ | ⚠️ hardcode | ❌ MRR, chart, distribusi paket hitung dari DB | P1 |
| **Plans: edit** | ✅ | ❌ tombol edit no-op | ❌ | P0 |
| **Notifikasi bell list** | ⚠️ realtime channel ada | ❌ hanya dot | ❌ | P1 |
| **Search global (Ctrl+K)** | ❌ | UI saja | ❌ | P2 |
| **Export / Backup** | ❌ | ❌ | ❌ | P2 |

---

## 3. Roadmap Penyempurnaan — 4 Fase

### Fase 0 — Fondasi (P0, 3-5 hari) — *Wajib sebelum tambah fitur*
- [ ] **Sinkron Design System**: putuskan 1 palet. Rekomendasi: pertahankan `DESIGN_SYSTEM.md` (green) sebagai source of truth, override `globals.css` brand → `#22c55e` series. Audit semua `brand-` usage.
- [ ] **Security: middleware + env**
  - Buat `src/middleware.ts` (Next middleware) cek session via `@supabase/ssr`, protect `/dashboard/*`, redirect `/` jika sudah login.
  - Ganti `src/lib/supabase.ts` → 2 client: `supabase/browser` (anon) + `supabase/server` (SSR). Hapus `SUPABASE_SERVICE_ROLE_KEY` dari `.env.local` ter-commit → pindah ke Vercel env / `.env.local.example` + `.gitignore`.
  - Rotate key yang ter-expose di repo.
- [ ] **Types**: generate `supabase gen types` → `src/lib/database.types.ts`, hilangkan semua `any`.
- [ ] **Hapus mock**: `dashboard/page.tsx` hapus `setTimeout` stat → query real (`students count`, `sessions today`, `reports pending`, `fees unpaid sum`). `admin/page.tsx` hapus ListRow hardcode → query `tenants order by created_at limit 5`.
- [ ] **Fix tenant fetch bug**: `schedule/page.tsx` line `select students tanpa filter tenant_id`; `fees/page.tsx` sama. Wajib `eq tenant_id`.
- [ ] **Invoice_no unik**: ganti random → `INV-YYYYMM-sequence` via `SELECT max` atau `pg sequence` / `nanoid`, tambah `UNIQUE` constraint.

### Fase 1 — Core Teacher Flow Lengkap (P0-P1, 1-2 minggu)
- [ ] **Students**: tambah Edit (modal pakai data sama), toggle ACTIVE/INACTIVE, validasi: email regex, phone `08*`, fee_amount >=0, soft delete.
- [ ] **Plans Admin: Edit**: wiring tombol pencil → modal edit (PATCH), validasi `student_limit`, `monthly_price`.
- [ ] **Schedule**: wiring edit/hapus session, ubah status `DONE/CANCELLED`, validasi overlap waktu per tenant+student, tambah `location` field.
- [ ] **Classes** — page baru `dashboard/classes/page.tsx`: list kelas GROUP/INDIVIDUAL, tambah anggota via `class_members`, hitung `default_fee`.
- [ ] **Attendance** — page `dashboard/attendance/page.tsx`: ambil dari `sessions` hari ini → tandai PRESENT/ABSENT_BILLABLE/ABSENT_FREE, hitung `charge_amount`.
- [ ] **Reports** — page `dashboard/reports/page.tsx`: form `material/progress/homework/score/teacher_note`, publish toggle.
- [ ] **Fees polish**: due_date logic = `period + fee_due_day` dari `students`/`teacher_settings`, filter UNPAID/PARTIAL/PAID/OVERDUE, action `Tandai Lunas` → isi `paid_at`, partial modal.
- [ ] **Settings beneran**: sambungkan ke `teacher_settings` (phone, payment_instructions, whatsapp_template, form_token), auto-create row saat tenant dibuat (trigger).

### Fase 2 — Growth & Monetization (P1-P2, 2 minggu)
- [ ] **Notif Center**: dropdown bell → list 10 terbaru (students INSERT, fees OVERDUE, reports pending), mark read, realtime via channel per-tenant.
- [ ] **WhatsApp provider**: pilih (Fonnte/Wablas/WA Gateway), simpan `whatsapp_template` dengan placeholder `{{student}} {{amount}} {{period}}`, kirim via Edge Function.
- [ ] **Billing real**: hitung MRR = `sum(monthly_price where tenants.status=ACTIVE join plans)`, chart distribusi paket, trial_end countdown + cron suspend.
- [ ] **Parent Portal** ` /p/[token]` atau login parent → lihat jadwal + laporan + tagihan anak (RLS sudah siap).
- [ ] **Search global Cmd+K**: index students/fees/sessions client-side atau `pg_search`.
- [ ] **Recurring schedule**: generate sessions mingguan dari `schedule_rule` (butuh tabel baru `schedule_rules`).

### Fase 3 — Hardening & Scale (P2, ongoing)
- [ ] **Pagination + server filter** (supabase `.range`, search `ilike`), debounce.
- [ ] **Audit log** tabel `audit_logs`, trigger INSERT/UPDATE/DELETE.
- [ ] **Storage**: foto profil → Supabase Storage bucket `avatars`, RLS.
- [ ] **Email**: reset password flow beneran (`supabase.auth.resetPasswordForEmail`), onboarding email.
- [ ] **Testing**: Vitest + Playwright (critical: login, tambah siswa, buat tagihan). 1 assert per modul.
- [ ] **Observability**: Sentry, log `logs/`.
- [ ] **Deploy**: Vercel + Supabase migrations (`supabase/migrations/`), `next.config` strict, `eslint` rules.

---

## 4. Detail Perbaikan Arsitektur

### 4.1 Auth & RLS
```
Problem: guard hanya di useEffect → flash + bypass via curl.
Fix:
- src/middleware.ts (match /dashboard/:path*)
- src/lib/supabase/server.ts  createServerClient(cookies)
- src/lib/supabase/client.ts  createBrowserClient
- RLS: tambah policy `Admins can manage all` untuk tables yang miss: fees, sessions, dll sudah ada tapi cek `is_admin()` undefined saat anon → test.
- Hapus `createClient` anon di layout admin → pakai server component untuk data awal.
```

### 4.2 DB Fixes (migrasi)
```sql
-- tambah di supabase/migrations/
alter table tenants add constraint fk_plan foreign key (plan_id) references plans(id) on delete set null;
alter table students add constraint uq_parent_email unique? → tidak, 1 parent banyak anak.
alter table fees add constraint uq_invoice_no unique (invoice_no);
alter table fees add constraint chk_amount check (amount >= 0);
create index idx_students_tenant on students(tenant_id);
create index idx_sessions_tenant_start on sessions(tenant_id, start_at);
create index idx_fees_tenant_period on fees(tenant_id, period);
-- tambah ON DELETE CASCADE atau handle di trigger:
-- contoh: delete tenant → hapus semua child via trigger, bukan manual 1-1 di admin.ts (sekarang miss fees, reports, teacher_settings)
-- tambah tabel schedule_rules, audit_logs, notifications
```

### 4.3 File Target Setelah Penyempurnaan
```
src/
  app/
    middleware.ts
    (auth)/login/page.tsx, (auth)/forgot/page.tsx
    dashboard/
      (teacher)/ students, schedule, classes, attendance, reports, fees, settings
      (admin)/ teachers, plans
      (parent)/ children, invoices
  lib/
    supabase/{client,server}.ts
    database.types.ts
    validators.ts (zod)
    format.ts (rupiah, date)
  components/
    ui/ (Button, Input, Modal, Badge, EmptyState)  ← ekstrak dari duplikasi inputClass
    MetricCard.tsx (perbaiki atau hapus, sekarang tidak dipakai)
  supabase/
    migrations/ 001_init.sql ... 002_fix_rls.sql
```

### 4.4 Bugs Terkonfirmasi (per file)
- `src/app/page.tsx: Head` import `next/head` tidak perlu di App Router → hapus, pakai `metadata`.
- `src/app/dashboard/layout.tsx:46` `select('*, tenants(*)')` → N+1, mending `profiles + tenants` terpisah; `profiles.tenant_id` bisa null saat tenant dibuat race.
- `src/app/dashboard/page.tsx:86` `setTimeout 1000` mock → ganti query.
- `src/app/dashboard/students/page.tsx:54` query tanpa `tenant_id` filter di `fetchData` students sudah benar, tapi `schedule` salah.
- `src/app/dashboard/schedule/page.tsx:54` `from students select tanpa eq tenant_id` → bocor data tenant lain jika RLS fail.
- `src/app/dashboard/fees/page.tsx:96` `invoice_no` random 0-999 → collision tinggi.
- `src/components/MetricCard.tsx` pakai `material-symbols-outlined` sementara app pakai `ti-*` → inkonsisten.
- `globals.css` `@theme` brand rose vs `DESIGN_SYSTEM.md` green → pilih 1.
- `.env.local` ter-commit → rotasi segera.

---

## 5. UX / Design Debt

- [ ] Ekstrak komponen duplikat: `inputClass`, `FormField`, `StatCard`, `GridMenuCard` → `src/components/ui/*`
- [ ] Ganti `alert/confirm` → modal konfirmasi + toast (`sonner` tanpa tambah dep jika mau: pakai div native).
- [ ] Empty state konsisten: icon 24px + teks konteks (sudah bagus, tinggal standarisasi).
- [ ] Loading skeleton: sekarang `animate-pulse` sederhana → pertahankan, tambah `aria-busy`.
- [ ] Accessibility: semua input butuh `label htmlFor`, modal butuh `focus-trap` + `Esc` close.
- [ ] Mobile: bottom nav `pb-safe` sudah ada, tapi butuh `dvh` bukan `h-screen` untuk iOS.

---

## 6. Estimasi & Urutan Eksekusi

| Urutan | Task | Effort | Dampak |
|---|---|---|---|
| 1 | Middleware + env rotate + types | S | Keamanan |
| 2 | Hapus mock + fix query tenant | S | Data benar |
| 3 | Students edit + validation | M | Core |
| 4 | Plans edit | S | Admin |
| 5 | Schedule edit/delete + overlap | M | Core |
| 6 | Classes + Attendance + Reports page | L | Fitur hilang |
| 7 | Settings ↔ teacher_settings | M | Konfigurasi |
| 8 | Fees polish + invoice fix | M | Revenue |
| 9 | Notif center + WA template | M | Engagement |
| 10 | Parent portal + MRR chart | L | Growth |

`S < 1 hari, M 1-3 hari, L 3-5 hari`

---

## 7. Definisi Selesai (Done Criteria)

- [ ] Semua page tanpa `any`, tanpa hardcode, tanpa `alert`.
- [ ] `npm run build` + `npm run lint` hijau, RLS test lolos (teacher A tidak lihat data B, parent hanya anaknya).
- [ ] Design token 1 sumber, screenshot per page match `DESIGN_SYSTEM.md`.
- [ ] E2E: login → tambah siswa → buat sesi → tandai hadir → buat tagihan → download PDF → WA link benar.
- [ ] `.env.local` tidak ter-commit, `supabase/migrations` versioned.

---

## 8. Next Step (Paling Minimal untuk Mulai)

1. `git rm --cached .env.local && echo ".env.local" >> .gitignore` + rotate key di Supabase dashboard.
2. Buat `src/middleware.ts` + `src/lib/supabase/{client,server}.ts` → hapus guard client-side duplikat.
3. `npx supabase gen types typescript --project-id yhluotoxsglwxfabjcxw > src/lib/database.types.ts`
4. Perbaiki `globals.css` brand atau `DESIGN_SYSTEM.md` — pilih 1, commit.
5. Ganti mock stats → query real.

> Skipped: payment gateway integrasi (Xendit/Midtrans), multi-currency, i18n full — add when ada transaksi real. `ponytail: manual fee WA link cukup untuk MVP, ganti WA Gateway saat volume >50 tagihan/bulan.`

---

*Generated: 2026-09-12 — scan 17 file src + schema.sql + design system + env*
