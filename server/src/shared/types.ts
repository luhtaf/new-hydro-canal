/**
 * KONTRAK BERSAMA — tipe domain new-hydro-canal.
 *
 * Sumber kebenaran tunggal untuk shape data yang dipakai lintas slice (BE + FE).
 * File ini diduplikat identik di `client/src/shared/types.ts`. Kalau ngubah satu,
 * ubah keduanya (sengaja duplikat supaya tiap workspace self-contained di TS strict;
 * tidak ada cross-package import yang bikin tsconfig path ribet).
 *
 * Acuan schema: PLAN-BE.md "Schema MongoDB". Aturan domain: DOMAIN.md.
 *
 * CATATAN: tipe di sini = bentuk "plain object" (DTO / lean doc), BUKAN tipe Mongoose
 * Document. Slice model BE boleh extend dengan Document<...> sendiri.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enum / union dasar
// ─────────────────────────────────────────────────────────────────────────────

/** Status flow canal (DOMAIN.md "Status flow"). */
export type CanalStatus = 'Submitted' | 'Assigned' | 'In Progress' | 'Done';

/** Role user. USV ikut data assignment, bukan identitas. */
export type Role = 'admin' | 'operator';

/** Tipe request AOI per canal. RE-QC = +1 ke REV di output. */
export type RequestType = 'QC' | 'RE-QC';

/** Status ketersediaan operator. */
export type UserStatus = 'aktif' | 'cuti';

/** Kode USV operator (KBN01–KBN05). */
export type UsvCode = 'KBN01' | 'KBN02' | 'KBN03' | 'KBN04' | 'KBN05';

/** Jenis aksi yang di-audit. */
export type AuditAction =
  | 'edit'
  | 'sync'
  | 'assign'
  | 'threshold'
  | 'login'
  | 'export'
  | 'import';

/** Jenis notifikasi. */
export type NotificationKind =
  | 'undangan'
  | 'konflik'
  | 'sync'
  | 'penugasan'
  | 'threshold';

/** Warna brand-token untuk notifikasi (mapping ke Tailwind di FE). */
export type NotificationColor = 'brand' | 'rose' | 'emerald' | 'amber';

/** Tone badge (deadline / status). */
export type Tone = 'emerald' | 'amber' | 'rose' | 'slate' | 'brand';

/** ID Mongo dalam bentuk string (lintas wire selalu string). */
export type Id = string;

// ─────────────────────────────────────────────────────────────────────────────
// Entity / collection (PLAN-BE.md "Schema MongoDB")
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  _id: Id;
  name: string;
  email: string;
  /** Field identitas utama = email. idpSubject disisakan kosong untuk bolt-on SSO. */
  idpSubject?: string | null;
  /** bcrypt hash PIN (cost 12). JANGAN pernah dikirim ke client. */
  pinHash?: string;
  role: Role;
  /** KBN01–05 untuk operator, null untuk admin. */
  usv: UsvCode | null;
  status: UserStatus;
  initials: string;
  productivityCache?: {
    kanal30d: number;
    passRate: number;
    reqcRate: number;
  };
  lastActiveAt: string; // ISO date
  createdAt: string;
}

/** Header AOI (1 file Excel). */
export interface Aoi {
  _id: Id;
  region: string; // 'Palembang'
  area: string; // 'SUMSEL P1'
  vendor: string; // 'PT. KARTA BHUMI NUSANTARA'
  notificationTitle: string; // 'AOI QC Canal USV Notification'
  importedAt: string;
  importedBy: Id; // User
  canalCount: number;
  sourceFile?: string;
}

/** 1 row Excel AOI = 1 Canal ID dengan Order No sendiri (DOMAIN.md CRITICAL). */
export interface Canal {
  _id: Id;
  aoiId: Id;
  // dari Excel:
  district: string; // "D.SUNGAI_BEYUKU"
  orderNo: string; // unique, 10 digit
  requestDate: string;
  requestType: RequestType;
  canalId: string; // "SB180202"
  panjang: number; // meter
  dimensi: string; // "8X5X3" (PxLxT)
  measurePoint: string; // numerik tanpa spasi
  startDate: string;
  finishDate: string;
  contractor: string; // full name
  coordX: number; // UTM Easting (zona 48S)
  coordY: number; // UTM Northing
  status: CanalStatus;
  // assigning:
  assignedTo: Id | null;
  assignedAt: string | null;
  usv: UsvCode | null;
  // outcome:
  qcOutput: string | null; // filename TXT saat Done
  dataId: Id | null; // link ke Data document existing
  // tracking:
  createdAt: string;
  updatedAt: string;
}

/** District (extended dari existing — extend, bukan replace). */
export interface District {
  _id: Id;
  districtName: string; // existing
  districtId: string; // existing — 4-char kode untuk filename
  regionName?: string; // BARU
  contractorId?: Id | null; // BARU (link ke Contractor)
}

/** Contractor untuk mapping shortName di chart export. */
export interface Contractor {
  _id: Id;
  fullName: string; // "PT CIPTA BUANA SAMUDRA"
  shortName: string; // "PT. CBS"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Threshold singleton (collection `Pengukurans` — existing, port persis).
 * NB: nama collection legacy "Pengukuran" = data threshold, BUKAN data pengukuran lapangan.
 */
export interface Pengukuran {
  _id?: Id;
  tidakLulus: number;
  toleransi: { batasAwal: number; batasAkhir: number };
  lulus: number;
}

export interface AuditLog {
  _id: Id;
  userId: Id;
  userName: string; // denormalized
  userInitials: string;
  action: AuditAction;
  kind: string; // "Drag-edit kedalaman", dll
  target: string; // "KBN01-K02 · STA 720"
  detail?: string; // "2.710 → 2.840"
  ts: string;
}

export interface Notification {
  _id: Id;
  userId: Id;
  kind: NotificationKind;
  icon: string;
  color: NotificationColor;
  title: string;
  body: string;
  read: boolean;
  ts: string;
  link?: string; // hash route
}

// ─────────────────────────────────────────────────────────────────────────────
// Data nested (existing — di-port persis, backward compatible)
// PLAN-BE.md "Data (models/DataModel.js existing)"
// ─────────────────────────────────────────────────────────────────────────────

/** 1 titik kedalaman di sepanjang STA. */
export interface DepthPoint {
  _id?: Id;
  lattitude: number; // sic — ejaan legacy dipertahankan untuk kompat data lama
  longitude: number;
  time: string;
  depth: number;
  sta: number;
  sta_distance: number;
}

/** 1 segmen canal (canal_data[]). */
export interface CanalDataSegment {
  _id?: Id;
  canal_id: string;
  dimensi: { panjang: number; lebar: number; tinggi: number };
  order_no: string;
  operation_no: string;
  start: string;
  end: string;
  measure_point: string;
  water_level: string;
  depth_correction: string;
  bed_float: string;
  revision: string;
  qc_type: string;
  operator: string;
  qc_date: string;
  measure_date: string; // BARU
  usv_code: string;
  district: { name: string; code: string };
  region?: string; // BARU
  canal_upper_width: number;
  canal_bottom_width: number;
  canal_length: number;
  tranducer: number; // sic — ejaan legacy
  lane: number;
  content_name: string;
  coord_x?: number; // BARU (UTM Easting)
  coord_y?: number; // BARU (UTM Northing)
  data: DepthPoint[];
}

/** Root Data document (nested deep). */
export interface Data {
  _id: Id;
  batang_canal_id: string;
  canal_data: CanalDataSegment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC (local-first custom REST — spec § D)
// ─────────────────────────────────────────────────────────────────────────────

/** Tipe doc kecil flat yang ditulis offline (PouchDB). */
export type SyncDocType = 'parameter' | 'depth' | 'canal' | 'meta';

/**
 * Doc yang dipindah PouchDB ⇄ server. Doc kecil & flat (spec § D "doc kecil flat
 * + projection"); server memproyeksikan ke schema Data nested.
 */
export interface SyncDoc<T = Record<string, unknown>> {
  /** PouchDB _id, mis. "parameter:<canalId>" atau "depth:<canalId>:<sta>". */
  _id: string;
  _rev?: string; // PouchDB revision
  type: SyncDocType;
  /** Payload spesifik per type. */
  payload: T;
  /** updatedAt server saat client terakhir pull doc ini (untuk conflict detection). */
  serverBase?: string | null;
  /** Timestamp tulis lokal (ISO). */
  updatedAt: string;
  /** Soft-delete tombstone. */
  _deleted?: boolean;
}

/** Operasi durable di outbox (spec § D "Outbox pattern"). */
export interface OutboxOp {
  /** id unik op (untuk idempotency). */
  opId: string;
  docId: string;
  /** snapshot doc yang mau dikirim. */
  doc: SyncDoc;
  /** jumlah percobaan kirim. */
  attempts: number;
  /** epoch ms kapan boleh retry lagi (backoff). */
  nextRetryAt: number;
  createdAt: string;
  lastError?: string;
}

/** Item konflik untuk UI /konflik. */
export interface ConflictItem {
  docId: string;
  type: SyncDocType;
  /** Versi lokal (yang gagal di-push). */
  lokal: SyncDoc;
  /** Versi server saat ini. */
  server: SyncDoc;
  /** Strategi default yang disarankan (spec § D "Conflict resolution"). */
  strategy: 'lww' | 'manual' | 'server-wins';
  detectedAt: string;
}

/** Hasil per-doc dari POST /sync/push. */
export type PushResult =
  | { id: string; ok: true; rev?: string }
  | { id: string; ok: false; conflict: { lokal: SyncDoc; server: SyncDoc } };

/** Response GET /sync/pull. */
export interface PullResponse {
  changes: SyncDoc[];
  lastSeq: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE DOMAIN HELPERS (slice shared-domain yang implement)
// Tipe argumen/return di sini = kontrak; implementasi di shared/domain/*.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parameter untuk hitung final depth (DOMAIN.md poin 4).
 * Formula: (depth + water_level + tranducer + bed_float - depth_correction) * -1
 */
export interface DepthParams {
  depth: number;
  water_level: number;
  tranducer: number; // sic — ejaan legacy
  bed_float: number;
  depth_correction: number;
}

/** Threshold untuk klasifikasi warna depth (DOMAIN.md poin 5). */
export interface Threshold {
  lulus: number;
  tidakLulus: number;
  batasAwal: number;
  batasAkhir: number;
}

/** Klasifikasi hasil threshold. */
export type ThresholdClass = 'pass' | 'tolerance' | 'fail';

/** Info deadline hasil hitung (DOMAIN.md poin 1). */
export interface DeadlineInfo {
  /** Tanggal deadline (requestDate + 4 hari). */
  deadline: Date;
  /** Selisih hari dari "hari ini" (negatif = lewat). */
  daysLeft: number;
  /** Label siap-tampil, mis. "Sisa 3 hari" / "LEWAT 2 hari". */
  label: string;
  tone: Tone;
}

/** Parameter untuk generate output filename (DOMAIN.md poin 7). */
export interface FileNameParams {
  /** kode distrik 4-char (mis. "3C01"). */
  districtCode: string;
  /** QC Date / Budat (untuk YYMMDD). */
  qcDate: Date;
  usv: string; // "KBN01"
  /** nomor urut file dalam 1 hari per operator. */
  urut: number;
  /** revision number (default 0 → "R0"). */
  revision?: number;
  requestType: RequestType;
}

/** Hasil split canal panjang > 999m (DOMAIN.md poin 6). */
export interface CanalSegment {
  /** STA mulai segmen. */
  staStart: number;
  /** STA akhir segmen. */
  staEnd: number;
  /** panjang segmen (canal_length). */
  length: number;
  /** apakah STA pertama di-skip (sambungan, hindari duplikat). */
  skipFirstSta: boolean;
}

/** Koordinat WGS84 hasil convert dari UTM (DOMAIN.md "Koordinat"). */
export interface LatLng {
  lat: number;
  lng: number;
}
