// Uzbek Latin text renders the "o'" and "g'" sounds with several
// visually-similar but distinct Unicode characters depending on keyboard/OS
// (U+02BB, U+02BC, U+2018/2019 curly quotes, plain ASCII apostrophe, and the
// backtick some keyboards substitute). Students rarely reproduce the exact
// glyph the teacher used, so all of them are stripped before comparison
// rather than picked apart — "gʻoznachi", "g'oznachi" and "goznachi" must all
// compare equal.
const APOSTROPHE_VARIANTS = /[ʻʼ'''`´]/g;

export function normalizeAnswerText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(APOSTROPHE_VARIANTS, "")
    .replace(/\s+/g, " ");
}

/**
 * Classic Levenshtein edit distance (insertions + deletions + substitutions),
 * single-row DP. Open-ended answer keys are short (a word or a few words), so
 * the O(n*m) cost here is negligible.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(
        Math.min(
          currentRow[j - 1] + 1, // insertion
          prevRow[j] + 1, // deletion
          prevRow[j - 1] + cost // substitution
        )
      );
    }
    prevRow = currentRow;
  }

  return prevRow[b.length];
}

/**
 * Open-ended answer checker: normalizes both sides (case/whitespace/Uzbek
 * apostrophe-insensitive), then accepts the student's answer as correct if
 * it's an exact match or within `maxDistance` edits of the teacher's key —
 * one typo, one missing letter, or one extra letter must still be marked
 * correct (Q36-45's a/b sub-answers).
 */
export function isFuzzyTextMatch(
  studentAnswer: string | null | undefined,
  correctAnswer: string,
  maxDistance = 1
): boolean {
  if (!studentAnswer) return false;

  const normalizedStudent = normalizeAnswerText(studentAnswer);
  const normalizedCorrect = normalizeAnswerText(correctAnswer);
  if (normalizedStudent.length === 0) return false;
  if (normalizedStudent === normalizedCorrect) return true;

  // Edit distance can never be smaller than the length difference — skip the
  // DP entirely once that alone exceeds the tolerance.
  if (Math.abs(normalizedStudent.length - normalizedCorrect.length) > maxDistance) {
    return false;
  }

  return levenshteinDistance(normalizedStudent, normalizedCorrect) <= maxDistance;
}
