/**
 * Sidebar — navigasi kiri desktop + drawer mobile.
 *
 * Demo ref: index.html <aside id="sidebar">. Grup label uppercase, nav-link active
 * dengan gradient + ring (class .nav-link.active dari globals.css), badge counter,
 * dan storage card di bawah. Item admin-only difilter by role (visibleGroups).
 *
 * Mobile: sidebar di-overlay sebagai drawer (ui.sidebarOpen), klik link → tutup.
 */
import { NavLink } from 'react-router-dom';
import { useRole } from '../stores/role.js';
import { useUi } from '../stores/ui.js';
import { visibleGroups, type NavItem } from './nav-config.js';
import { Icon } from './Icon.js';

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `nav-link ${isActive ? 'active' : ''} ${item.indent ? 'pl-7 text-[0.8125rem]' : ''}`
      }
    >
      <Icon name={item.icon} className="w-[18px] h-[18px]" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span
          className={`ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold ${
            item.badge.color === 'rose' ? 'bg-rose-500' : 'bg-brand-500'
          }`}
        >
          {item.badge.count}
        </span>
      )}
    </NavLink>
  );
}

function StorageCard() {
  return (
    <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-100">
      <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs">
        <Icon name="hard-drive" className="w-3.5 h-3.5" />
        Penyimpanan lokal
      </div>
      <div className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
        PouchDB · <span className="font-mono text-slate-900">14.2 MB</span> / 50 MB
      </div>
      <div className="mt-2 h-1.5 bg-brand-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
          style={{ width: '28%' }}
        />
      </div>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate: () => void }) {
  const role = useRole((s) => s.role);
  const groups = visibleGroups(role);
  return (
    <div className="space-y-1">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="px-3 pt-4 pb-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-400 first:pt-2">
            {g.title}
          </div>
          {g.items.map((it) => (
            <NavRow key={it.to} item={it} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
      <StorageCard />
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useUi((s) => s.sidebarOpen);
  const closeSidebar = useUi((s) => s.closeSidebar);

  return (
    <>
      {/* Desktop */}
      <aside id="sidebar" className="hidden md:block no-print">
        <div className="sticky top-20">
          <SidebarBody onNavigate={() => {}} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeSidebar} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80%] bg-white shadow-pop overflow-y-auto animate-slide-down p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">Menu</span>
              <button
                className="p-1.5 rounded-lg hover:bg-slate-100"
                onClick={closeSidebar}
                aria-label="Tutup menu"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <SidebarBody onNavigate={closeSidebar} />
          </div>
        </div>
      )}
    </>
  );
}
