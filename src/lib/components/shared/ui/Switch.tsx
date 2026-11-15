interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function Switch({ checked, onChange, disabled, id, ...aria }: SwitchProps) {
  // On = --lume-text track, matching Checkbox: a selected state reads as
  // neutral and strong, indigo stays for actions and focus. The thumb glides
  // with the shared glide easing; reduced motion snaps it.
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      {...aria}
      disabled={disabled}
      onClick={onChange}
      className={[
        'group relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5',
        "pointer-coarse:before:absolute pointer-coarse:before:left-1/2 pointer-coarse:before:top-1/2 pointer-coarse:before:h-11 pointer-coarse:before:w-14 pointer-coarse:before:-translate-1/2 pointer-coarse:before:content-['']",
        'transition-[background-color,box-shadow] duration-[var(--duration-glide)] ease-[var(--ease-glide)] motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'bg-[var(--lume-text)]'
          : 'bg-active shadow-[inset_0_0_0_1px_var(--lume-edge)] hover:bg-strong',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none block size-4 rounded-full',
          'transition-transform duration-[var(--duration-glide)] ease-[var(--ease-glide)] motion-reduce:transition-none',
          checked
            ? 'translate-x-4 bg-[var(--lume-bg)]'
            : 'translate-x-0 bg-[var(--lume-surface-raised)] shadow-[0_1px_2px_var(--shadow-color),inset_0_0_0_1px_var(--lume-edge)]',
        ].join(' ')}
      />
    </button>
  );
}
