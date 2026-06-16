/**
 * NotFoundPage — fallback route `*`. Empty-state + CTA balik dashboard.
 */
import { Link } from 'react-router-dom';
import { Icon } from './Icon.js';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="text-center">
        <div className="font-mono text-5xl font-bold text-slate-300">404</div>
        <h1 className="sec-title mt-3">Halaman tidak ditemukan</h1>
        <p className="text-sm text-slate-500 mt-1">Rute yang kamu tuju tidak ada.</p>
        <Link to="/" className="btn btn-primary mt-5 inline-flex">
          <Icon name="home" className="w-4 h-4" />
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
