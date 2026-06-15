/**
 * Controller User (admin-only) — validasi zod + delegasi ke service + tulis audit.
 * Tipis: tak ada logika domain di sini (ada di user.service).
 *
 * Audit: tiap mutasi (create/update/delete/reset-pin) → AuditLog action 'edit'
 * (PORT demo "Tambah operator" di renderAudit). userId/userName dari sesi admin.
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { getAuthUser } from '../../shared/middleware/auth.js';
import { AuditLog } from '../../shared/models/index.js';
import {
  createUser,
  getUser,
  listUsers,
  resetPin,
  softDeleteUser,
  updateUser,
} from './user.service.js';

const roleSchema = z.enum(['admin', 'operator']);
const usvSchema = z.union([
  z.enum(['KBN01', 'KBN02', 'KBN03', 'KBN04', 'KBN05']),
  z.null(),
]);
const statusSchema = z.enum(['aktif', 'cuti']);
const pinSchema = z.string().regex(/^\d{4,6}$/, 'PIN harus 4–6 digit angka');

const createSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  pin: pinSchema,
  role: roleSchema,
  usv: usvSchema.optional(),
  status: statusSchema.optional(),
  initials: z.string().min(1).max(4).optional(),
});

const updateSchema = createSchema
  .omit({ pin: true })
  .partial()
  .refine((b) => Object.keys(b).length > 0, {
    message: 'Body kosong — minimal 1 field untuk update',
  });

const resetPinSchema = z.object({ pin: pinSchema });

/** Tulis 1 baris audit (best-effort — gagal audit JANGAN gagalkan request). */
async function writeAudit(
  req: Request,
  kind: string,
  target: string,
  detail?: string,
): Promise<void> {
  try {
    const admin = getAuthUser(req);
    await AuditLog.create({
      userId: admin.id,
      userName: admin.name,
      userInitials: admin.initials,
      action: 'edit',
      kind,
      target,
      detail,
    });
  } catch {
    // audit best-effort: telan error supaya operasi utama tetap sukses.
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  const includeRevoked = req.query.includeRevoked === 'true';
  const data = await listUsers({ includeRevoked });
  res.json({ data });
}

export async function postUser(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const user = await createUser(body);
  await writeAudit(req, 'Tambah operator', user.name, `role ${user.role}`);
  res.status(201).json({ data: user });
}

export async function patchUser(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const user = await updateUser(req.params.id ?? '', body);
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  await writeAudit(req, 'Edit operator', user.name, Object.keys(body).join(', '));
  res.json({ data: user });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id ?? '';
  const admin = getAuthUser(req);
  if (id === admin.id) {
    res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri', code: 'SELF_DELETE' });
    return;
  }
  // Ambil nama untuk audit sebelum di-soft-delete.
  const target = await getUser(id);
  const ok = await softDeleteUser(id);
  if (!ok) {
    res.status(404).json({ error: 'User tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  await writeAudit(req, 'Nonaktifkan operator', target?.name ?? id, 'soft delete');
  res.json({ ok: true });
}

export async function postResetPin(req: Request, res: Response): Promise<void> {
  const body = resetPinSchema.parse(req.body);
  const id = req.params.id ?? '';
  const target = await getUser(id);
  const ok = await resetPin(id, body.pin);
  if (!ok) {
    res.status(404).json({ error: 'User tidak ditemukan', code: 'NOT_FOUND' });
    return;
  }
  await writeAudit(req, 'Reset PIN', target?.name ?? id, 'PIN di-reset admin');
  res.json({ ok: true });
}
