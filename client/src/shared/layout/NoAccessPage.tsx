/**
 * NoAccessPage — ditampilkan saat operator mengakses URL admin langsung.
 *
 * Demo touch: "Akses terbatas" page. Route admin dibungkus <RequireAdmin> di
 * router; kalau role bukan admin → render ini, bukan halaman aslinya.
 */
import { Link } from 'react-router-dom';
import { Icon } from './Icon.js';

export function NoAccessPage() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card">
      <div className="empty-state">
        <span className="empty-state-icon text-amber-500">
          <Icon name="shield-check" className="w-7 h-7" />
        </span>
        <h2 className="sec-title">Akses terbatas</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Halaman ini hanya untuk role <span className="font-semibold">Admin</span>. Ganti role
          lewat pill di kanan atas, atau hubungi manajer kalau kamu butuh akses.
        </p>
        <Link to="/" className="btn btn-ghost mt-5 inline-flex">
          <Icon name="arrow-right" className="w-4 h-4" />
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
