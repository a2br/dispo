/**
 * EPFL people directory, via the public JSON endpoint behind search.epfl.ch.
 * No key, CORS open, returns only what people.epfl.ch already shows publicly.
 * People who hide their directory profile are not returned, so coverage is incomplete.
 */

export type DirectoryPerson = {
  sciper: string;
  name: string; // "Baptiste Bouilhol" (first given name + last name)
  fullName: string; // "Baptiste Bernard Bouilhol"
  email: string;
  unit: string | null; // "MT-MA1"
  role: string | null; // "Student"
  profileUrl: string | null;
};

type Raw = {
  sciper?: string;
  name?: string;
  firstname?: string;
  email?: string;
  profile?: string;
  accreds?: { acronym?: string; position?: string | null; order?: number }[];
};

const ENDPOINT = "https://search-api.epfl.ch/api/ldap";
const TTL_MS = 10 * 60_000;
const cache = new Map<string, { at: number; people: DirectoryPerson[] }>();

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function toPerson(r: Raw): DirectoryPerson | null {
  if (!r.sciper || !r.email || !r.name) return null;
  const first = (r.firstname ?? "").trim();
  const accred = [...(r.accreds ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))[0];
  return {
    sciper: r.sciper,
    name: [first.split(/\s+/)[0], r.name].filter(Boolean).join(" "),
    fullName: [first, r.name].filter(Boolean).join(" "),
    email: r.email.toLowerCase(),
    unit: accred?.acronym ?? null,
    role: accred?.position ?? null,
    profileUrl: r.profile ? `https://people.epfl.ch/${encodeURIComponent(r.profile)}` : null,
  };
}

/** Rank people whose names start with the query words first; the API itself returns alphabetical order. */
function score(p: DirectoryPerson, words: string[]): number {
  const parts = norm(p.fullName).split(/[\s-]+/);
  let s = 0;
  for (const w of words) {
    if (parts.some((x) => x === w)) s += 3;
    else if (parts.some((x) => x.startsWith(w))) s += 2;
    else if (parts.some((x) => x.includes(w))) s += 1;
  }
  return s;
}

export async function searchDirectory(q: string, limit = 8): Promise<DirectoryPerson[]> {
  const query = q.trim().replace(/\s+/g, " ");
  if (query.length < 3) return [];
  const key = norm(query);
  const hit = cache.get(key);
  let people: DirectoryPerson[];
  if (hit && Date.now() - hit.at < TTL_MS) {
    people = hit.people;
  } else {
    try {
      const res = await fetch(`${ENDPOINT}?${new URLSearchParams({ q: query, hl: "en" })}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const raw = (await res.json()) as Raw[];
      people = (Array.isArray(raw) ? raw : []).map(toPerson).filter((p): p is DirectoryPerson => p !== null);
    } catch {
      return []; // directory down or slow: app search still works
    }
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), people });
  }
  const words = key.split(" ");
  return [...people]
    .map((p, i) => ({ p, i, s: score(p, words) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.p);
}
