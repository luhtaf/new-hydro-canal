# DESIGN.md — new-hydro-canal Design System

> Sumber kebenaran visual produksi. Target: app TIDAK terlihat AI-generated, terasa
> seperti template premium berbayar — kiblat dashboard **Linear / Vercel / Stripe**.
> Implementasi token: [`client/tailwind.config.ts`](./client/tailwind.config.ts) +
> [`client/src/shared/styles/globals.css`](./client/src/shared/styles/globals.css).
> Heading font di-load via [`client/index.html`](./client/index.html) (Google Fonts, no install).
>
> Aturan emas: **kalau ragu, kurangi**. Restraint > dekorasi. Density > whitespace boros.

---

## 1. Aesthetic direction

App operasional QC kanal untuk operator lapangan + admin. Bukan landing page marketing —
ini **tool kerja padat data** yang dipakai berjam-jam. Maka:

- **Calm, confident, dense.** Layar penuh tabel, kartu kanal, chart kedalaman. Tata
  letak harus tenang supaya mata tidak lelah, tapi rapat informasi (compact).
- **Satu aksen percaya diri:** brand sky/cyan (`#0284c7 → #0ea5e9`). Dipakai untuk
  *intent* (primary action, state aktif, fokus, link), **bukan** dekorasi. Sisanya
  netral (slate). Warna semantik (emerald/amber/rose) hanya untuk status QC pass/tol/fail.
- **Surface berlapis halus.** Kedalaman diciptakan via shadow + border tipis berlapis,
  bukan border tebal atau drop-shadow Tailwind default yang "berasap".
- **Tipografi punya karakter.** Heading pakai grotesk geometric (Space Grotesk) yang
  tegas + sedikit teknikal — kontras dengan body Inter yang netral. Angka & ID pakai
  JetBrains Mono (tabular). Ini yang membedakan dari "Inter-untuk-semua" khas AI slop.

### Vibe satu kalimat
> Cockpit kontrol QC yang tenang dan presisi — seperti Linear yang dipakai surveyor.

---

## 2. Typography

Pairing 3-font berkarakter (bukan mono-Inter):

| Peran | Font | Kapan dipakai |
|---|---|---|
| **Display / Heading** | **Space Grotesk** (600/700) | `h1`–`h3`, judul section (`.sec-title`), logo wordmark, angka stat besar, page title |
| **Body / UI** | **Inter** (400/500/600) | teks tubuh, label, tombol, nav, tabel, form |
| **Mono** | **JetBrains Mono** (400/500) | Order No, Canal ID, koordinat UTM, kedalaman, kbd, kode output filename |

Space Grotesk dipilih karena: geometric grotesk dengan terminal khas (g/a single-story
opsional, angka tegas) → terasa teknikal & premium, cocok untuk tool surveyor, dan
**tidak** generik. Body tetap Inter agar keterbacaan padat-data maksimal.

### Skala (type scale — 1.20 minor third, dibulatkan ke rem rapi)

| Token | size / line-height | weight | Pemakaian |
|---|---|---|---|
| `text-display` | 30px / 36px | 700 | page hero / angka stat besar |
| `text-2xl` | 24px / 30px | 700 | judul halaman |
| `text-xl` | 20px / 28px | 600/700 | judul section besar |
| `text-lg` | 18px / 26px | 600/700 | `.sec-title` |
| `text-base` | 15px / 22px | 400/500 | body default (catatan: 15px, bukan 16 — density) |
| `text-sm` | 13.5px / 20px | 400/500 | UI sekunder, tabel, form |
| `text-xs` | 12px / 16px | 500/600 | meta, label, badge |
| `text-[11px]` | 11px / 14px | 600 | label grup nav uppercase, lock-badge |
| `text-[10px]` | 10px / 13px | 600 | sub-label role pill, badge counter |

Aturan hierarki tegas (lawan dari "semua medium"):
- **Heading = Space Grotesk + tracking ketat** (`-0.02em`). Body = Inter normal.
- Berat hanya 3 langkah: 400 (body), 500/600 (emphasis/label), 700 (heading/angka).
  Jangan pakai 800 untuk teks UI (kesan loud/AI). 800 hanya wordmark bila perlu.
- `tabular-nums` wajib untuk kolom angka/tabel agar rata.
- Tracking: heading rapat (`tracking-tight`), label uppercase longgar (`tracking-wider`).

---

## 3. Color tokens

Palet **restrained**: 1 neutral ramp (slate) + 1 accent (brand) + 3 semantic status.
Jangan tambah hue baru tanpa alasan domain.

### Neutral — `slate` (sudah jadi default Tailwind, kita kunci pemakaiannya)
Background app `slate-50`, surface `white`/`slate-900` (dark), teks `slate-900`,
sekunder `slate-600`, muted `slate-400`, border `slate-200`.

### Accent — `brand` (sky/cyan, ground-truth demo)
```
brand-50  #f0f9ff   brand-300 #7dd3fc   brand-600 #0284c7  (primary)
brand-100 #e0f2fe   brand-400 #38bdf8   brand-700 #0369a1
brand-200 #bae6fd   brand-500 #0ea5e9   brand-900 #0c4a6e
```
Primary fill = gradient `brand-500 → brand-600`. Fokus ring = `brand-500` @ 35% alpha.
Aktif/hover state = `brand-50`/`brand-100` tint.

### Semantic status (QC) — pakai HANYA untuk status, bukan dekorasi
| Token | Hue | Arti |
|---|---|---|
| `ok` / pass | emerald (`#10b981 / #047857`) | lolos QC, sync penuh, sukses |
| `warn` / tolerance | amber (`#f59e0b / #b45309`) | toleransi, offline, perlu perhatian |
| `bad` / fail | rose (`#f43f5e / #be123c`) | gagal QC, konflik, error |
| `info` | brand | netral-informatif |

### Dark mode
Background `#020617` (slate-950), surface `#0f172a`, elevated `#1e293b`,
border `#1e293b`/`#334155`, teks `#e2e8f0`. Accent tetap brand tapi state-tint
pakai alpha rendah (12–15%) supaya tidak menyala. (Sudah dihandle di globals.css.)

---

## 4. Spacing — 8pt rhythm

Basis grid **4px**, irama utama **8px**. Token spacing Tailwind sudah 4px-based;
kita tambah beberapa step rapi + pakai konsisten:

| Konteks | Nilai |
|---|---|
| Padding kartu | `p-4` (16) / `p-5` (20) untuk kartu besar |
| Gap antar kartu / grid | `gap-4` (16) / `gap-6` (24) section |
| Padding input | `0.55rem 0.75rem` (≈9/12) — compact |
| Tinggi baris tabel | 36–40px (compact, tabular) |
| TopNav height | `h-14` (56) |
| Sidebar width | `15rem` (240) |
| Section vertical rhythm | `space-y-6` (24) |
| Inset halaman | `px-4` mobile, container `max-w-7xl` |

Aturan: **selalu kelipatan 4**, sebisa mungkin 8. Hindari angka ganjil ad-hoc
(`p-[13px]`) — itu jejak AI. Density tinggi = lebih suka 12/16 daripada 24/32.

---

## 5. Radius

Lebih kecil & konsisten dari default (lawan "semua rounded-2xl"):

| Token | Nilai | Pemakaian |
|---|---|---|
| `rounded` (sm) | 6px | badge, kbd, chip kecil, lock-badge |
| `rounded-lg` | 8px | tombol, input, nav-link |
| `rounded-xl` | 12px | **kartu / surface (default)** |
| `rounded-2xl` | 16px | modal, hero card, dialog |
| `rounded-full` | pill | role pill, badge dot, avatar, toggle |

Default surface = `rounded-xl` (12). Jangan campur 3 radius berbeda di satu kartu.

---

## 6. Shadow / border — subtle berlapis (BUKAN default Tailwind)

Shadow Tailwind default (`shadow`, `shadow-md`) terlalu "berasap" & rata — jejak AI.
Kita pakai shadow **berlapis halus** (ambient + key light tipis) + border 1px sebagai
batas utama. Token di tailwind config:

| Token | Definisi | Pemakaian |
|---|---|---|
| `shadow-soft` | `0 1px 2px rgb(15 23 42 / .04), 0 1px 3px rgb(15 23 42 / .06)` | kartu diam, panel |
| `shadow-card` | `0 1px 2px rgb(15 23 42 / .05), 0 2px 6px rgb(15 23 42 / .06)` | kartu interaktif/hover-able |
| `shadow-pop` | `0 4px 12px -2px rgb(15 23 42 / .10), 0 12px 28px -8px rgb(15 23 42 / .14)` | dropdown, drawer, sidebar mobile |
| `shadow-float` | `0 20px 50px -12px rgb(15 23 42 / .25)` | modal, command palette, tour card |
| `shadow-focus` | `0 0 0 3px rgb(14 165 233 / .35)` | ring fokus input (via globals) |

Border: batas utama selalu `1px solid slate-200` (dark: `slate-800/#1e293b`).
**Border dulu, shadow secukupnya** — bukan shadow tebal tanpa border.

> Catatan penting: token `shadow-soft / shadow-card / shadow-pop` SUDAH dipakai luas
> di folder fitur tapi sebelumnya BELUM terdefinisi (silent no-op). Mendefinisikannya
> di sini otomatis memperbaiki tampilan seluruh app.

---

## 7. Motion

Halus, cepat, fungsional. Easing premium = `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo-ish).

| Aksi | Durasi | Easing |
|---|---|---|
| Hover (warna/bg) | 120ms | ease |
| Slide-down / panel masuk | 220ms | `0.16,1,0.3,1` |
| Slide-up (toast) | 240ms | `0.16,1,0.3,1` |
| Scale-in (modal/palette) | 180ms | `0.16,1,0.3,1` |
| Spotlight tour | 260ms | `0.16,1,0.3,1` |
| Fade | 160–200ms | ease-out |

Aturan: transisi hanya properti yang perlu (`transform`, `opacity`, `background`,
`box-shadow`) — jangan `transition: all` di area berat. Hormati `prefers-reduced-motion`.
Hover lift maksimal `translateY(-1px)` — subtle, bukan melompat.

---

## 8. Iconography

**Lucide, satu weight konsisten** (`stroke-width: 2`). Ukuran standar:
`16px` (inline/tombol), `18px` (nav), `20px` (bottom tab / aksi utama).
Jangan campur stroke 1.5 & 2.5 dalam satu layar. Ikon = penunjuk, bukan dekorasi —
satu ikon per aksi, jangan dobel ikon di satu tombol.

---

## 9. Data density

Ini tool kerja, bukan brosur. Default ke **compact**:
- Tabel: baris 36–40px, padding sel `px-3 py-2`, `text-sm`, `tabular-nums`.
- Kartu kanal: info padat, label `text-xs` muted + value `text-sm/font-medium`.
- Form lapangan: input compact (`.input-sm`), grup rapat.
- Hindari hero kosong & padding `p-8+` kecuali empty-state.

---

## 10. Do / Don't — anti-AI checklist

**DO**
- Pakai 1 accent (brand) dengan intensional; sisanya netral.
- Heading Space Grotesk + tracking ketat; mono untuk semua angka/ID.
- Shadow berlapis halus + border 1px; radius `xl` (12) sebagai default surface.
- Spacing kelipatan 4/8; density tinggi.
- Status warna HANYA untuk status QC.
- Tabular-nums di kolom angka; align kanan untuk angka.

**DON'T**
- ❌ Inter untuk semua (heading = body) → flat, generik, ciri AI.
- ❌ Gradient warna-warni / multi-hue dekoratif. Brand gradient hanya untuk primary & logo.
- ❌ Shadow Tailwind default tebal "berasap" tanpa border.
- ❌ Semua `rounded-2xl` / `rounded-3xl` membulat berlebihan.
- ❌ Berat font 800 untuk teks UI; emoji sebagai ikon; ikon beda-beda stroke.
- ❌ Padding ganjil ad-hoc (`p-[13px]`, `gap-[7px]`).
- ❌ Whitespace boros ala landing page di layar kerja.
- ❌ Animasi `transition: all` + bounce lebay.

---

## 11. Demo touches (WAJIB dipertahankan)

Token baru tidak boleh menghapus: **dark mode**, **⌘K command palette**, **walkthrough
tour 8-step**, **role pill** (admin amber / operator blue), offline banner, sync drawer,
toast, confirm modal, live clock, breadcrumb, splash, lock badge. Semua tetap jalan
dengan token baru — dark mode di-tune ulang agar accent tidak menyala.
