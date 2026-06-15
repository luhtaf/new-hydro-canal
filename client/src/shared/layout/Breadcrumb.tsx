/**
 * Breadcrumb — global, derive dari pathname + label nav-config.
 *
 * Demo touch: breadcrumb global. Segmen dipetakan ke label manusiawi kalau dikenal
 * (dari NAV_GROUPS), kalau tidak fallback ke segmen ter-titlecase. Segmen ID
 * dinamis (mis. :orderNo / :canalId) ditampilkan mono.
 */
import { Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from './nav-config.js';
import { Icon } from './Icon.js';

/** Map path → label dari nav-config (sumber tunggal). */
const LABELS: Record<string, string> = (() => {
  const m: Record<string, string> = { '/': 'Dashboard' };
  for (const g of NAV_GROUPS) for (const it of g.items) m[it.to] = it.label;
  // beberapa label segmen yang tidak punya nav-link sendiri
  m['/lapangan'] = 'Lapangan';
  m['/admin'] = 'Admin';
  return m;
})();

function titleCase(seg: string): string {
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function looksLikeId(seg: string): boolean {
  return /^\d/.test(seg) || /\d{4,}/.test(seg) || /^[A-Z]{2}\d/.test(seg);
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;

  const parts = pathname.split('/').filter(Boolean);
  const crumbs = parts.map((seg, i) => {
    const to = '/' + parts.slice(0, i + 1).join('/');
    const label = LABELS[to] ?? (looksLikeId(seg) ? seg : titleCase(seg));
    return { to, label, isId: !LABELS[to] && looksLikeId(seg) };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="no-print mb-4 flex items-center gap-1.5 text-sm text-slate-500"
    >
      <Link to="/" className="hover:text-slate-900 inline-flex items-center gap-1">
        <Icon name="home" className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.to} className="inline-flex items-center gap-1.5">
            <span className="text-slate-300">/</span>
            {last ? (
              <span className={`font-semibold text-slate-900 ${c.isId ? 'font-mono text-xs' : ''}`}>
                {c.label}
              </span>
            ) : (
              <Link
                to={c.to}
                className={`hover:text-slate-900 ${c.isId ? 'font-mono text-xs' : ''}`}
              >
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
