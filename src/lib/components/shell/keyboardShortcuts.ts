export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

export function sidebarToggleLabel(): string {
  return isMacPlatform() ? '⌘B' : 'Ctrl+B';
}
