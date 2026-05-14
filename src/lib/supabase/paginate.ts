// PostgREST caps each response at `db-max-rows` (1000 by default on Supabase),
// silently overriding any client-side `.limit(N > 1000)`. This helper iterates
// a query with `.range()` until a short page is returned, so callers don't
// have to remember the cap. Always pair with a stable `.order(...)` on the
// builder so paging is deterministic.

const PAGE_SIZE = 1000;

// Chunk size for `.in()` filters. PostgREST encodes filters in the URL
// (`?col=in.(uuid1,uuid2,…)`), and Supabase's edge layer rejects URLs over
// ~8 KB. 200 UUIDs ≈ 7.4 KB of IDs alone, which leaves headroom for the
// host/path/select clause without risking 414/empty responses.
const IN_CHUNK_SIZE = 200;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function fetchAllPages<T>(
  buildPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: string | null }> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error: error.message };
    if (!data || data.length === 0) break;
    for (const row of data) all.push(row);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { data: all, error: null };
}

// Like `fetchAllPages`, but for queries filtered by `.in(col, ids)` where
// `ids` may be too large to fit in a single URL. Splits `ids` into chunks
// and runs each chunk through `fetchAllPages` in parallel.
export async function fetchAllByIn<T>(
  ids: string[],
  buildPage: (idsChunk: string[], from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: string | null }> {
  if (ids.length === 0) return { data: [], error: null };
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + IN_CHUNK_SIZE));
  }
  const results = await Promise.all(
    chunks.map((chunk) => fetchAllPages<T>((from, to) => buildPage(chunk, from, to))),
  );
  const all: T[] = [];
  for (const r of results) {
    if (r.error) return { data: [], error: r.error };
    for (const row of r.data) all.push(row);
  }
  return { data: all, error: null };
}
