export function score(query: string, label: string, keywords: readonly string[] = []): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const hay = [label, ...keywords].join(' ').toLowerCase();
  if (hay.includes(q)) return 10 - hay.indexOf(q) / 100;

  let qi = 0;
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}
