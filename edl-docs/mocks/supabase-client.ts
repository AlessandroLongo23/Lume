// @/lib/supabase/client in the docs canvas: the typed client, pointed at a
// local address with a dummy key and never awaited by a story. Stores that
// import it load; their fetches fail quietly.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

export const supabase = createBrowserClient<Database>('http://127.0.0.1:9', 'docs');
