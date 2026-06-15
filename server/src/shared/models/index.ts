/**
 * Barrel model SHARED — model lintas-fitur tanpa owner tunggal.
 *
 * Aturan (guardrail global #1): model masuk sini HANYA kalau dipakai >=2 fitur DAN
 * tak ada owner jelas. Kalau ada owner → taruh di folder fitur owner, fitur lain import.
 *
 * Kandidat shared (PLAN-BE.md): District, Contractor, AuditLog, Notification, User,
 * + model existing (Data, Pengukuran). Slice yang relevan menambah export di sini
 * saat model-nya benar-benar shared.
 *
 * User: shared (auth, penugasan, canal/assign, audit, reports). Owner = none → di sini.
 * District: shared (district CRUD owner, qc filename, reports per-region).
 * Pengukuran: shared (pengukuran CRUD owner, qc/chart warna, reports breakdown). Singleton.
 */
export { UserModel, type UserDoc } from './User.js';
export { District, type DistrictDoc } from './District.js';
export { Pengukuran, type PengukuranDoc } from './Pengukuran.js';
export { Data, type DataDoc } from './Data.js';
export { Contractor, type ContractorDoc } from './Contractor.js';
export { Aoi, type AoiDoc } from './Aoi.js';
export { Canal, type CanalDoc } from './Canal.js';
export { AuditLog, type AuditLogDoc } from './AuditLog.js';
export { Notification, type NotificationDoc } from './Notification.js';
