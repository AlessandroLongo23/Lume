'use client';

import { useCallback, useState } from 'react';

export type UploadFileState = 'idle' | 'uploading' | 'done' | 'error';

export interface UploadProgress {
  filename: string;
  state: UploadFileState;
  /** 0..1 */
  progress: number;
  error?: string;
}

interface InitFile {
  slot: number;
  jobId: string;
  filename: string;
  storagePath: string;
  uploadUrl: string;
  uploadToken: string;
}

interface InitResponse {
  success: boolean;
  onboardingId?: string;
  files?: InitFile[];
  error?: string;
}

/**
 * Drives a multi-file upload with per-file progress. Calls /init to get signed
 * URLs, PUTs each file in parallel via XHR (so we get upload progress events),
 * then calls /start to kick off classification.
 *
 * The state shape (`uploads` keyed by filename) is what the DropView and the
 * MagicView read while the upload is in flight.
 */
export function useOnboardingUpload() {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const updateFile = useCallback((filename: string, patch: Partial<UploadProgress>) => {
    setUploads((prev) => ({
      ...prev,
      [filename]: { ...(prev[filename] ?? { filename, state: 'idle', progress: 0 }), ...patch },
    }));
  }, []);

  const start = useCallback(
    async (files: File[]): Promise<{ onboardingId: string } | null> => {
      if (files.length === 0) return null;
      setBusy(true);
      setError(null);
      // Initialize progress map so the UI shows pending slots immediately.
      setUploads(
        Object.fromEntries(
          files.map((f) => [f.name, { filename: f.name, state: 'idle', progress: 0 }] as const),
        ),
      );

      try {
        const initRes = await fetch('/api/onboarding/imports/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: files.map((f) => ({ filename: f.name, sizeBytes: f.size })),
          }),
        });
        const initJson: InitResponse = await initRes.json();
        if (!initJson.success || !initJson.files || !initJson.onboardingId) {
          // Existing-onboarding case: surface its id so the caller can resume.
          if (initJson.onboardingId) return { onboardingId: initJson.onboardingId };
          throw new Error(initJson.error ?? 'Errore init');
        }

        // Upload all files in parallel via XHR for progress tracking.
        await Promise.all(
          initJson.files.map((slot) => {
            const file = files.find((f) => f.name === slot.filename);
            if (!file) return Promise.resolve();
            return uploadOne(file, slot.uploadUrl, (progress) => updateFile(file.name, { state: 'uploading', progress }))
              .then(() => updateFile(file.name, { state: 'done', progress: 1 }))
              .catch((err: Error) => updateFile(file.name, { state: 'error', error: err.message }));
          }),
        );

        const startRes = await fetch('/api/onboarding/imports/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingId: initJson.onboardingId }),
        });
        const startJson = await startRes.json();
        if (!startJson.success) throw new Error(startJson.error ?? 'Errore start');

        return { onboardingId: initJson.onboardingId };
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [updateFile],
  );

  return { uploads, error, busy, start };
}

function uploadOne(
  file: File,
  url: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload fallito (${xhr.status})`));
    });
    xhr.addEventListener('error', () => reject(new Error('Errore di rete durante l\'upload')));
    xhr.send(file);
  });
}
