---
feature: help
owns: []                                  # tidak punya model/collection — konten statis
uses_models: []                           # tidak baca model apa pun
touches_features: ["shell"]               # CTA memicu walkthrough tour (shared tour-store)
jobs: []
---

# Fitur: Help (FE — halaman bantuan)

## Apa ini
HelpPage di route `/help` (port demo `view-help`): tabel keyboard shortcuts,
glossary lengkap istilah QC kanal (sinkron DOMAIN.md), FAQ collapsible, dan
Quick start CTA yang men-trigger walkthrough tour 8-step. Konten murni statis —
tidak ada query/mutation, tidak menyentuh PouchDB/model.

## Isi folder
- `HelpPage.tsx` — page utama (default export untuk lazy route), layout 3-kolom
  (shortcuts + glossary + FAQ | aside Quick start/kontak/about). Kontak & about.
- `FaqAccordion.tsx` — FAQ collapsible terkontrol React (port `<details>` demo;
  chevron animasi + transisi tinggi, dark-mode aware). Item pertama default open.
- `content.ts` — sumber data statis: `SHORTCUTS`, `GLOSSARY`, `FAQ`, `CONTACTS`
  (+ tipe). Acuan tunggal teks istilah, dipisah dari layout supaya greppable
  & reusable (mis. command palette "cari istilah" nanti).
- `routes.tsx` — `helpRoutes` (`/help`, lazy, tanpa role gating — bantuan publik).
- `index.ts` — barrel publik (routes + page + FaqAccordion + konten/tipe).

## Keterkaitan
- Quick start CTA → `useTour().start()` dari **[shell]** (`shared/layout/tour-store`).
  CTA navigate ke `/` dulu (tour menyorot elemen dashboard/topnav) baru start;
  jumlah step di-render dari `TOUR_STEPS.length`. Ubah langkah tour di tour-store →
  teks "Tur N-step" di sini ikut otomatis (tidak hardcode).
- Daftar shortcut deskriptif harus sinkron dengan **[shell]** `useShortcuts`
  (⌘K/ESC) + `CommandPalette` (↑↓↵). ⌘P/⌘R didelegasikan ke browser native.
- Glossary = pointer baca-only ke aturan domain; JANGAN jadikan sumber kebenaran
  formula (lihat Aturan domain). Kalau DOMAIN.md berubah, update teks di `content.ts`.
- Icon baru (keyboard/book-open/help-circle/chevron-down/message-circle/github)
  ditambah ke registry `shared/lib/icon.ts` (pola extension yang disahkan barrel itu).

## Jobs/Cron
—

## Aturan domain
Hanya mendeskripsikan, tidak menghitung. Teks final depth di glossary harus
match `shared/domain/depth` (DOMAIN.md poin 5):
`(depth + water_level + tranducer + bed_float − depth_correction) * -1`.
Deadline (poin 2), Measure Date clamp (poin 4), auto-split >999m (poin 6),
QC Type/REV — semua hanya dijelaskan; sumber kebenaran tetap `shared/domain`.
