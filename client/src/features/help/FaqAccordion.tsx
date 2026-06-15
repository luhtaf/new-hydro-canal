/**
 * FaqAccordion — daftar FAQ collapsible (port `<details>` demo ke React).
 *
 * State terbuka dikontrol React (bukan native <details>) supaya animasi chevron
 * + transisi tinggi mulus dan konsisten di dark mode. Aksesibel: tombol
 * aria-expanded + region. Item pertama default terbuka (demo touch).
 */
import { useState } from 'react';
import { Icon } from '../../shared/layout/Icon.js';
import type { FaqItem } from './content.js';

interface Props {
  items: FaqItem[];
}

export function FaqAccordion({ items }: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    items.reduce<Record<number, boolean>>((acc, item, i) => {
      acc[i] = Boolean(item.defaultOpen);
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open[i];
        return (
          <div
            key={item.q}
            className="rounded-lg border border-slate-200 overflow-hidden transition-colors hover:border-slate-300"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((s) => ({ ...s, [i]: !s[i] }))}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left text-sm font-semibold text-slate-800"
            >
              <span>{item.q}</span>
              <Icon
                name="chevron-down"
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="px-3.5 pb-3.5 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
