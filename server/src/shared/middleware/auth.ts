/**
 * Guard auth + role. Diisi oleh slice [auth]; ditaruh di shared karena dipakai
 * >=2 fitur (canal, sync, qc, penugasan, audit, dst) — guardrail global #1.
 *
 * Model auth: session cookie (express-session + connect-mongo). Online = cookie
 * valid; offline tolerance lewat maxAge 30 hari (lihat app.ts). MULTI-AKUN: tiap
 * akun = sesi/cookie sendiri; server stateless soal device.
 *
 * requireAuth juga cek revoke (spec § C "Admin bisa revoke akun, efektif saat
 * device online lagi"): bandingkan tokenVersion sesi vs DB. Revoked/naik versi
 * → 401, client redirect ke login.
 */
import type { Request, RequestHandler } from 'express';
import { UserModel } from '../models/index.js';
import type { Role } from '../types.js';

/** Akun login di request ini (di-set requireAuth setelah verifikasi). */
export interface AuthUser {
  id: string;
  name: string;
  initials: string;
  role: Role;
  usv: string | null;
}

/** Ambil akun terverifikasi dari request (lempar 401 kalau belum auth). */
export function getAuthUser(req: Request): AuthUser {
  const u = (req as Request & { authUser?: AuthUser }).authUser;
  if (!u) {
    const err = new Error('Belum login') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return u;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const sess = req.session.user;
  if (!sess) {
    res.status(401).json({ error: 'Belum login', code: 'UNAUTHENTICATED' });
    return;
  }

  // Cek revoke saat device online (query ringan; offline tak sampai sini).
  UserModel.findById(sess.id)
    .select('+pinHash tokenVersion revoked')
    .lean()
    .then((user) => {
      if (!user || user.revoked || (user.tokenVersion ?? 0) !== sess.tokenVersion) {
        req.session.destroy(() => {
          res.status(401).json({ error: 'Sesi dicabut', code: 'SESSION_REVOKED' });
        });
        return;
      }
      (req as Request & { authUser?: AuthUser }).authUser = {
        id: sess.id,
        name: sess.name,
        initials: sess.initials,
        role: sess.role,
        usv: sess.usv,
      };
      next();
    })
    .catch(next);
};

export const requireRole =
  (role: Role): RequestHandler =>
  (req, res, next) => {
    requireAuth(req, res, () => {
      const u = (req as Request & { authUser?: AuthUser }).authUser;
      if (!u || u.role !== role) {
        res.status(403).json({ error: 'Akses ditolak', code: 'FORBIDDEN' });
        return;
      }
      next();
    });
  };
