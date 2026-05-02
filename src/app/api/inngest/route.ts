import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processImport } from '@/lib/inngest/functions/processImport';
import { commitImport } from '@/lib/inngest/functions/commitImport';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processImport, commitImport],
});
