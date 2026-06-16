/**
 * useShiftSelect — checkbox multi-select dengan shift-click range.
 * Demo touch "Bulk shift-select di tabel undangan" (port `selectRange shift+click`).
 * Slice-local (tabel undangan); logika murni dipisah supaya testable tanpa React.
 */
import { useCallback, useMemo, useState } from 'react';

/** Hitung Set terpilih baru setelah klik di `index` (pure, testable). */
export function applyShiftSelect(
  prev: Set<string>,
  ids: string[],
  index: number,
  id: string,
  shiftKey: boolean,
  anchor: number | null,
): Set<string> {
  const next = new Set(prev);
  if (shiftKey && anchor !== null) {
    const [lo, hi] = anchor < index ? [anchor, index] : [index, anchor];
    const turnOn = !prev.has(id);
    for (let i = lo; i <= hi; i++) {
      const rid = ids[i];
      if (!rid) continue;
      if (turnOn) next.add(rid);
      else next.delete(rid);
    }
  } else {
    if (next.has(id)) next.delete(id);
    else next.add(id);
  }
  return next;
}

export function useShiftSelect(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);

  const toggle = useCallback(
    (index: number, id: string, shiftKey: boolean) => {
      setSelected((prev) => applyShiftSelect(prev, ids, index, id, shiftKey, anchor));
      setAnchor(index);
    },
    [anchor, ids],
  );

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }, [ids]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allChecked = useMemo(
    () => ids.length > 0 && selected.size === ids.length,
    [ids.length, selected.size],
  );

  return {
    selected,
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAll,
    clear,
    allChecked,
    count: selected.size,
  };
}
