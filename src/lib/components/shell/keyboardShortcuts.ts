import { isMacPlatform } from '@/lib/utils/platform';

export { isMacPlatform };

export function sidebarToggleLabel(): string {
  return isMacPlatform() ? '⌘B' : 'Ctrl+B';
}

export function bugReportLabel(): string {
  return isMacPlatform() ? '⇧⌘B' : 'Ctrl+Shift+B';
}
