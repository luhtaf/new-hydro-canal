/**
 * BottomTabNav — tab bawah mobile (5 ikon). Demo ref: index.html nav.md:hidden.
 * Active = warna brand. Hidden di desktop & print.
 */
import { NavLink } from 'react-router-dom';
import { BOTTOM_TABS } from './nav-config.js';
import { Icon } from './Icon.js';

export function BottomTabNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-5 text-[11px] font-medium text-slate-500 no-print">
      {BOTTOM_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 gap-0.5 ${
              isActive ? 'text-brand-600' : ''
            }`
          }
        >
          <Icon name={tab.icon} className="w-5 h-5" />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
