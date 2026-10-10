// Supabase returns at most 1000 rows per request (the project's "max rows"
// setting) and says nothing when it cuts a list short. With ~5000 students
// and ~1000 marks per exam that silently drops data, so any read that can
// grow past that goes through here and is fetched page by page.
//
// `make` must build a fresh query each call and include a stable `.order()`
// (end with a unique column such as "id") so pages don't overlap.

const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function selectAll<T>(make: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await make(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}
