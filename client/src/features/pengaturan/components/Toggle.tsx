/**
 * Toggle — switch on/off ala demo `.toggle-switch` (data-toggle-setting).
 *
 * Aksesibel: role="switch" + aria-checked + keyboard (Space/Enter). Visual murni
 * pakai class `.toggle-switch` / `.on` dari globals.css (demo touch dipertahankan).
 */
interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Label aksesibilitas (visually-hidden; teks deskriptif ada di samping). */
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`toggle-switch ${checked ? 'on' : ''} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
    />
  );
}
