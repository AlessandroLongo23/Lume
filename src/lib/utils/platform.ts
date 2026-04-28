export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

export function formatShortcut(parts: { mod?: boolean; shift?: boolean; alt?: boolean; key: string }): string {
  const mac = isMacPlatform();
  if (mac) {
    let out = '';
    if (parts.mod) out += '⌘';
    if (parts.shift) out += '⇧';
    if (parts.alt) out += '⌥';
    return out + parts.key.toUpperCase();
  }
  const segs: string[] = [];
  if (parts.mod) segs.push('Ctrl');
  if (parts.shift) segs.push('Shift');
  if (parts.alt) segs.push('Alt');
  segs.push(parts.key.toUpperCase());
  return segs.join('+');
}
