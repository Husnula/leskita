# LesKita Design System

Panduan visual dan komponen UI untuk aplikasi LesKita Admin Console.

---

## 1. Prinsip Desain

| Prinsip | Penjelasan |
|---|---|
| **Clarity first** | Informasi penting harus langsung terbaca tanpa perlu mencari-cari |
| **Hierarchy tegas** | Ukuran, bobot, dan warna dipakai untuk memandu mata secara alami |
| **Restraint** | Warna aksen dipakai hemat — hanya untuk hal yang benar-benar penting |
| **Konsisten** | Komponen yang sama dipakai ulang di seluruh halaman |

---

## 2. Palet Warna

### Warna Utama

| Nama | Hex | Penggunaan |
|---|---|---|
| `--green` | `#22c55e` | Aksen utama, CTA primer, status aktif |
| `--green-dark` | `#15803d` | Hover state untuk elemen hijau |
| `--ink` | `#0f1117` | Teks utama, sidebar background, tombol dark |
| `--ink-2` | `#4a5060` | Teks sekunder |
| `--ink-3` | `#9299a8` | Teks tersier, placeholder, label |

### Warna Permukaan

| Nama | Hex | Penggunaan |
|---|---|---|
| `--surf` | `#f5f6f8` | Background halaman utama |
| `--card` | `#ffffff` | Background card dan panel |
| `--border` | `#e5e7eb` | Border card dan divider |

### Warna Sidebar

| Nama | Hex | Penggunaan |
|---|---|---|
| `--side` | `#0f1117` | Background sidebar |
| `--side-2` | `#1c2030` | Hover item sidebar |
| `--side-3` | `#262d3d` | Item sidebar aktif |
| `--side-text` | `#c8cdd8` | Teks sidebar |
| `--border-dk` | `#2a3347` | Border di dalam sidebar |

### Warna Semantik

| Nama | Hex | Dipakai untuk |
|---|---|---|
| `--green-bg` | `#f0fdf4` | Background badge / tint sukses |
| `--green-txt` | `#166534` | Teks di atas green-bg |
| `--purple` | `#8b5cf6` | Aksen plan Pro |
| `--purple-bg` | `#f5f3ff` | Background badge Pro |
| `--purple-txt` | `#5b21b6` | Teks di atas purple-bg |
| `--red` | `#ef4444` | Aksi destruktif (hapus) |
| `--red-bg` | `#fef2f2` | Background tombol hapus |
| `--red-txt` | `#991b1b` | Teks tombol hapus |
| `--blue` | `#3b82f6` | Link, info |
| `--amber` | `#f59e0b` | Warning |

---

## 3. Tipografi

Font utama: `system-ui, -apple-system, sans-serif`

### Skala

| Peran | Size | Weight | Contoh penggunaan |
|---|---|---|---|
| Page heading | `20px` | `600` | Judul halaman (Dashboard, Kelola Guru) |
| Card heading | `13px` | `600` | Header panel, card title |
| Body | `14px` | `400` | Teks umum |
| Label | `13px` | `400` | Konten dalam list, form label |
| Meta / caption | `11–12px` | `400` | Tanggal bergabung, email, workspace |
| Stat number | `26px` | `700` | Angka besar di stat card |
| Section label | `10px` | `700` | Label uppercase di sidebar, plan tier |

### Aturan

- Gunakan **sentence case** — bukan Title Case, bukan ALL CAPS (kecuali label 10px uppercase seperti tier name)
- Jangan gunakan `font-weight` di atas `700`
- Teks pada background berwarna harus menggunakan warna teks dari ramp yang sama (bukan hitam polos)

---

## 4. Spacing & Layout

### Grid Sistem

```
Sidebar    : 210px lebar, fixed
Content    : flex 1, overflow-y auto
Topbar     : 52px tinggi, fixed
Content padding : 28px
```

### Gap Standar

| Konteks | Nilai |
|---|---|
| Gap antar stat card | `12px` |
| Gap antar panel | `16px` |
| Gap antar teacher card | `12px` |
| Gap antar plan card | `16px` |
| Padding dalam card | `16px 18px` |
| Padding dalam plan card | `22px` |

### Border Radius

| Elemen | Radius |
|---|---|
| Card | `12px` |
| Plan card | `14px` |
| Tombol aksi | `9px` |
| Tombol kecil (action bar) | `6px` |
| Avatar | `50%` |
| Logo mark / ikon | `7–8px` |
| Badge / pill | `20px` |
| Bar chart | `3px` |

---

## 5. Komponen

### 5.1 Sidebar

Sidebar menggunakan background gelap (`#0f1117`) untuk kontras kuat dengan konten utama.

```
┌─────────────────────┐
│  [L] LesKita        │  ← Logo mark 30×30, hijau
│      Admin Console  │
├─────────────────────┤
│  MENU               │  ← Label 10px uppercase
│  ■ Dashboard        │  ← Nav item aktif (bg: #262d3d)
│    Kelola guru      │  ← Nav item biasa
│    Paket langganan  │
├─────────────────────┤
│  [P] pakhusnulid    │  ← User row di bagian bawah
│      Super Admin    │
└─────────────────────┘
```

**State nav item:**
- Default: `color: #c8cdd8`, background transparan
- Hover: `background: #1c2030`
- Aktif: `background: #262d3d`, `color: #ffffff`

---

### 5.2 Topbar

Tinggi 52px, background putih, border bawah `1px solid #e5e7eb`.

Berisi:
- Search bar (kiri) — max-width 340px, background `#f5f6f8`
- Ikon aksi (kanan) — moon, bell, logout — 18px, warna `#9299a8`

---

### 5.3 Stat Card

Dipakai di dashboard untuk metrik ringkas.

```
┌──────────────────────────────┐
│  LABEL UPPERCASE   [  ikon ] │
│                              │
│  26                          │
│  trend / sublabel            │
└──────────────────────────────┘
```

- Background: `#ffffff`
- Border: `1px solid #e5e7eb`
- Border radius: `12px`
- Padding: `16px 18px`
- Ikon dalam kotak 32×32, background tint pastel sesuai makna
- Angka besar: `26px / 700`
- Trend: `11px`, warna sesuai konteks (hijau = positif, abu = netral)

Grid stat card: `repeat(4, 1fr)`, gap `12px`

---

### 5.4 Panel

Panel dua kolom untuk konten ringkasan seperti "Pendaftar Terbaru" dan "Distribusi Paket".

- Background: `#ffffff`
- Border: `1px solid #e5e7eb`
- Border radius: `12px`
- Padding: `16px 18px`
- Header panel: `13px / 600`, dengan link "Lihat semua" di kanan (`11px`, biru)
- Grid: `1fr 1fr`, gap `16px`

**Row item dalam panel:**
- Padding: `8px 0`
- Border bawah: `1px solid #e5e7eb` (kecuali baris terakhir)
- Avatar: 32×32, rounded full
- Nama: `13px / 500`
- Meta: `11px`, warna `#9299a8`
- Pill/badge: margin-left auto

---

### 5.5 Teacher Card

Dipakai di halaman Kelola Guru. Grid: `repeat(3, 1fr)`.

```
┌──────────────────────────────┐
│ [AV]  Nama Guru    ● Aktif  │
│       Workspace              │
├──────────────────────────────┤
│ 📦  Free Tier                │
│ ✉   email@contoh.com         │
│ 📅  Bergabung 20/8/2026      │
├──────────────────────────────┤
│ [ Edit ]  [ Pesan ]  [🗑]   │
└──────────────────────────────┘
```

- Avatar: 40×40, rounded full
  - Guru dengan nama: background `#f0fdf4`, teks `#15803d`
  - Guru "Unknown": background `#f5f6f8`, teks `#9299a8`
- Email kosong ditampilkan sebagai teks miring abu-abu: *"Email belum diisi"*
- Action bar: 3 tombol, flex, border-top `1px solid #e5e7eb`
  - Edit & Pesan: background `#f5f6f8`, border `#e5e7eb`
  - Hapus: background `#fef2f2`, border `#fca5a5`, teks `#991b1b`

---

### 5.6 Badge / Pill

Dipakai untuk status dan label kategori.

| Varian | Background | Teks | Penggunaan |
|---|---|---|---|
| Aktif | `#f0fdf4` | `#166534` | Status guru aktif |
| Free | `#f5f6f8` | `#9299a8` | Tier gratis |
| Pro | `#f5f3ff` | `#5b21b6` | Tier Pro |

- Padding: `2–3px 8px`
- Border radius: `20px`
- Font size: `10–11px`, weight `600`
- Dot status aktif: lingkaran 6px warna `#22c55e`, inline sebelum teks

---

### 5.7 Plan Card

Dipakai di halaman Paket Langganan. Grid: `repeat(3, 1fr)`.

```
         ┌── [Terpopuler] ──┐    ← Badge absolute, hanya pada plan featured
┌────────┐  ┌──────────────┐  ┌────────┐
│  Free  │  │     Pro      │  │  Ent.  │
│  Rp 0  │  │  Rp 9.000   │  │Hubungi │
│ /bulan │  │  /bulan      │  │  kami  │
│────────│  │──────────────│  │────────│
│ ✓ 10   │  │ ✓ 30 siswa  │  │ ✓ ∞   │
│ ✗ WA   │  │ ✗ WhatsApp   │  │ ✓ WA  │
│ ✗ Brand│  │ ✗ Branding   │  │ ✓ Brand│
│────────│  │──────────────│  │────────│
│[Outline]  │  [ Solid ]   │  │[ Dark ]│
└────────┘  └──────────────┘  └────────┘
```

**Varian tombol CTA:**

| Varian | Style | Dipakai untuk |
|---|---|---|
| `outline` | Border abu, bg transparan | Plan gratis / plan aktif saat ini |
| `solid` | Background hijau `#22c55e`, teks putih | Plan featured / CTA utama |
| `dark` | Background `#0f1117`, teks putih | Plan Enterprise |

**Plan featured (Pro):**
- Border: `2px solid #22c55e` (satu-satunya pengecualian dari border 1px)
- Badge "Terpopuler": absolute, di atas card, background hijau

---

### 5.8 Bar Chart Sederhana

Dipakai dalam panel distribusi paket.

```
Free Tier                   4 akun
████████████████████████████████  (100%)

Pro                         0 akun
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (0%)
```

- Track: height `6px`, background `#f5f6f8`, border-radius `3px`
- Fill warna: hijau (Free), ungu (Pro), hitam (Enterprise)
- Label: `12px`, nilai di kanan `font-weight: 600`

---

### 5.9 Filter Bar

Dipakai di atas daftar guru untuk filtering.

- Search input: kiri, background putih, border normal
- Chip filter: kanan, border-radius `20px`
  - Default: background putih, border abu
  - Aktif: background `#0f1117`, teks putih

---

## 6. Ikonografi

Pakai **Tabler Icons** (outline only). Jangan gunakan variant `-filled`.

| Konteks | Ikon |
|---|---|
| Dashboard | `ti-layout-dashboard` |
| Kelola guru | `ti-chalkboard` |
| Paket langganan | `ti-package` |
| Search | `ti-search` |
| Lembaga | `ti-building` |
| Siswa | `ti-users` |
| MRR / Revenue | `ti-chart-line` |
| Email | `ti-mail` |
| Tanggal | `ti-calendar` |
| Paket | `ti-package` |
| Edit | `ti-edit` |
| Hapus | `ti-trash` |
| Pesan | `ti-message` |
| Notifikasi | `ti-bell` |
| Dark mode | `ti-moon` |
| Logout | `ti-logout` |
| Fitur tersedia | `ti-check` |
| Fitur tidak ada | `ti-x` |
| Grafik | `ti-chart-area` |

Ukuran ikon:
- Inline dalam teks / field: `13–15px`
- Nav sidebar: `16px`
- Tombol: `12–13px`
- Dekoratif / stat card: `15–18px`
- Empty state: `24px`

---

## 7. Pola Interaksi

### Hover State

| Elemen | Perubahan saat hover |
|---|---|
| Nav item sidebar | Background `#1c2030` |
| User row sidebar | Background `#1c2030` |
| Tombol outline | Border menjadi `#0f1117` |
| Tombol solid (hijau) | Background `#15803d` |
| Tombol dark | Background `#1c2030` |
| Action btn card | Background `#f0f0f0` |

### Status Kosong (Empty State)

Jika data kosong, tampilkan:
- Ikon besar `24px`, opacity `0.4`
- Teks deskriptif `12px`, warna `#9299a8`
- Tidak ada teks "Tidak ada data" — selalu beri konteks atau ajakan aksi

Contoh: *"Grafik pendapatan segera hadir"*

### Data Tidak Lengkap

Jika field wajib (seperti email) belum diisi:
- Tampilkan teks miring abu: *"Email belum diisi"*
- Warna: `#d1d5db`
- Jangan tampilkan tanda hubung (`—`) atau biarkan kosong

---

## 8. Layout Per Halaman

### Dashboard

```
[Topbar]
[Stat Card × 4]         ← grid 4 kolom
[Panel Kiri | Panel Kanan]  ← grid 2 kolom
```

### Kelola Guru

```
[Topbar]
[Filter Bar]
[Teacher Card × N]      ← grid 3 kolom
```

### Paket Langganan

```
[Topbar]
[Plan Card × 3]         ← grid 3 kolom
```

---

## 9. CSS Variables Referensi

```css
:root {
  /* Teks */
  --ink:     #0f1117;
  --ink-2:   #4a5060;
  --ink-3:   #9299a8;

  /* Permukaan */
  --surf:    #f5f6f8;
  --card:    #ffffff;
  --border:  #e5e7eb;

  /* Sidebar */
  --side:      #0f1117;
  --side-2:    #1c2030;
  --side-3:    #262d3d;
  --side-text: #c8cdd8;
  --border-dk: #2a3347;

  /* Aksen */
  --green:      #22c55e;
  --green-dark: #15803d;
  --green-bg:   #f0fdf4;
  --green-txt:  #166534;

  --purple:     #8b5cf6;
  --purple-bg:  #f5f3ff;
  --purple-txt: #5b21b6;

  --red:     #ef4444;
  --red-bg:  #fef2f2;
  --red-txt: #991b1b;

  --blue:  #3b82f6;
  --amber: #f59e0b;
}
```

---

## 10. Do & Don't

| ✅ Do | ❌ Don't |
|---|---|
| Pakai `#22c55e` hanya untuk aksi utama dan status aktif | Pakai warna hijau di mana-mana |
| Tampilkan "Email belum diisi" dengan italic abu | Biarkan field kosong atau tampilkan `-` |
| Gunakan border `2px` hanya untuk plan featured | Pakai border tebal di elemen lain |
| Semua label dalam sentence case | Gunakan Title Case atau ALL CAPS pada body text |
| Ikon Tabler outline saja | Gunakan ikon `-filled` (tidak terdukung) |
| Warna teks gelap pada background berwarna | Pakai teks hitam polos di atas background berwarna |
| Tampilkan empty state dengan konteks | Tampilkan halaman kosong tanpa penjelasan |
