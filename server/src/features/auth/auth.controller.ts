/**
 * Handler HTTP auth: login, me, logout, change-pin, revoke. Tipis — delegasi ke
 * auth.service. Urus sesi (express-session) + validasi input (zod) di sini.
 *
 * Sesi = SATU akun (spec § C). Multi-akun di device = banyak sesi/cookie; server
 * stateless. Login regenerate sesi (anti session fixation).
 */
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getAuthUser } from '../../shared/middleware/auth.js';
import { UserModel } from '../../shared/models/index.js';
import { clearLoginAttempts } from './loginRateLimit.js';
import {
  changePin as changePinSvc,
  revokeUser,
  toPublicUser,
  verifyCredentials,
} from './auth.service.js';

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    usv: z.string().optional(),
    pin: z.string().min(4).max(6),
  })
  .refine((b) => b.email || b.usv, { message: 'email atau usv wajib diisi' });

const changePinSchema = z.object({
  oldPin: z.string().min(4).max(6),
  newPin: z.string().min(4).max(6),
});

const revokeSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, 'userId tidak valid'),
});

export const login: RequestHandler = async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const identifier = body.email ?? body.usv!;
    const user = await verifyCredentials(identifier, body.pin);
    if (!user) {
      // Pesan generik — anti user enumeration.
      res.status(401).json({ error: 'Kredensial salah', code: 'BAD_CREDENTIALS' });
      return;
    }

    clearLoginAttempts(req.ip ?? 'unknown', identifier);

    // Regenerate sesi (anti session fixation) lalu simpan akun.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = {
        id: user.id,
        name: user.name,
        initials: user.initials,
        role: user.role,
        usv: user.usv,
        tokenVersion: user.tokenVersion,
      };
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ user });
      });
    });
  } catch (err) {
    next(err);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const u = getAuthUser(req);
    const found = await UserModel.findById(u.id).lean();
    if (!found) {
      res.status(401).json({ error: 'Sesi tidak valid', code: 'NO_SESSION' });
      return;
    }
    // Kontrak FE: { user: AuthProfile(userId...), revoked }.
    res.json({ user: toPublicUser(found), revoked: Boolean(found.revoked) });
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
};

export const changePin: RequestHandler = async (req, res, next) => {
  try {
    const u = getAuthUser(req);
    const body = changePinSchema.parse(req.body);
    const result = await changePinSvc(u.id, body.oldPin, body.newPin);
    if (!result.ok) {
      res.status(400).json({ error: result.reason, code: 'CHANGE_PIN_FAILED' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

/** Admin revoke akun lain (spec § C). Tak boleh revoke diri sendiri lewat sini. */
export const revoke: RequestHandler = async (req, res, next) => {
  try {
    const admin = getAuthUser(req);
    const body = revokeSchema.parse(req.body);
    if (body.userId === admin.id) {
      res.status(400).json({ error: 'Tidak bisa revoke akun sendiri', code: 'SELF_REVOKE' });
      return;
    }
    const found = await revokeUser(body.userId);
    if (!found) {
      res.status(404).json({ error: 'User tidak ditemukan', code: 'NOT_FOUND' });
      return;
    }
    const updated = await UserModel.findById(body.userId).lean();
    res.json({ ok: true, user: updated ? toPublicUser(updated) : null });
  } catch (err) {
    next(err);
  }
};
