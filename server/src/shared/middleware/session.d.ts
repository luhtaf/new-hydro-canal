/**
 * Augmentasi tipe express-session: shape data sesi yang dipakai auth.
 *
 * Cross-cutting (dipakai requireAuth + seluruh handler yang baca req.session).
 * MULTI-AKUN: server stateless soal device — tiap akun = 1 sesi (1 cookie) sendiri.
 * Device yang enroll banyak akun memegang banyak cookie; server tak tahu/peduli.
 * Yang diingat sesi hanyalah SATU akun yang login di sesi itu.
 */
import 'express-session';
import type { Role, UsvCode } from '../types.js';

declare module 'express-session' {
  interface SessionData {
    /** Akun yang login di sesi ini. Absen = belum login. */
    user?: {
      id: string;
      name: string;
      initials: string;
      role: Role;
      usv: UsvCode | null;
      /** Snapshot saat login; dicek vs DB untuk deteksi revoke (spec § C). */
      tokenVersion: number;
    };
  }
}
