import { FileText, Sheet, FileType } from 'lucide-react';

/**
 * File-type icon shared by the upload pills (DropView) and the in-flight feed
 * (FileFeed). Caller controls size and color via className.
 */
export function FileIcon({ filename, className }: { filename: string; className?: string }) {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'xlsx' || ext === 'xls') return <Sheet className={className} />;
  if (ext === 'pdf') return <FileType className={className} />;
  return <FileText className={className} />;
}
