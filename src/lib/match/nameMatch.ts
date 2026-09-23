// Fuzzy name matching for linking uploaded student blocks to class roster.

export type Candidate = { id: string; name: string; roll_no: number };

export type MatchResult = {
  status: "matched" | "review" | "unmatched";
  student_id: string | null;
  score: number;                 // 0..1
  candidates: Candidate[];       // top suggestions when review/unmatched
};

// Honorifics / titles to strip before matching.
// Both Marathi and English forms, with and without trailing dot.
const HONORIFICS = new Set([
  "कु", "कुमारी", "कुमार",
  "श्री", "श्रीमती", "सौ",
  "मास्तर", "मास्टर",
  "mr", "mrs", "ms", "miss", "master", "kum", "shri", "smt", "sri",
]);

// Normalize: strip Latin diacritics (safely — Devanagari vowel-signs stay
// intact), lowercase, replace punctuation with space, drop honorifics.
export function normalizeName(raw: string): string {
  const s = String(raw || "")
    .normalize("NFC")
    // Strip ONLY Latin combining diacritics (é → e). Devanagari uses its own
    // combining marks (U+0900–U+097F) which we must preserve.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Keep letters, numbers, marks (Devanagari vowel-signs are Mn marks),
    // and whitespace. Everything else (punctuation) becomes a space.
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.split(" ").filter((t) => t && !HONORIFICS.has(t)).join(" ");
}

// Tokens sorted — handles "Kalpak Bhoir" vs "Bhoir Kalpak"
function tokenSet(s: string): string {
  return normalizeName(s).split(" ").filter(Boolean).sort().join(" ");
}

// Levenshtein
function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - lev(a, b) / maxLen;
}

export function matchStudent(
  raw: string,
  candidates: Candidate[],
): MatchResult {
  if (!raw || !raw.trim() || candidates.length === 0) {
    return { status: "unmatched", student_id: null, score: 0, candidates: [] };
  }

  const target = tokenSet(raw);

  // Score all candidates
  const scored = candidates.map((c) => {
    const cnorm = tokenSet(c.name);
    let s = similarity(target, cnorm);
    // Boost if one is a substring of the other (handles missing middle name etc.)
    if (cnorm.includes(target) || target.includes(cnorm)) {
      s = Math.max(s, 0.9);
    }
    // Exact match short-circuits
    if (cnorm === target) s = 1;
    return { c, s };
  }).sort((a, b) => b.s - a.s);

  const best = scored[0];
  const runnerUp = scored[1];

  // Thresholds:
  // >= 0.95  → matched (auto)
  // >= 0.70  → review (admin must confirm)
  // < 0.70   → unmatched, show top 3 anyway
  if (best.s >= 0.95 && (!runnerUp || best.s - runnerUp.s >= 0.05)) {
    return { status: "matched", student_id: best.c.id, score: best.s, candidates: [best.c] };
  }
  if (best.s >= 0.7) {
    return {
      status: "review",
      student_id: best.c.id,
      score: best.s,
      candidates: scored.slice(0, 5).map((x) => x.c),
    };
  }
  return {
    status: "unmatched",
    student_id: null,
    score: best.s,
    candidates: scored.slice(0, 5).map((x) => x.c),
  };
}
