/**
 * slugify.js — Unicode-Safe Slug & Batch Code Generator
 *
 * Decomposes Latin macrons (ā, ī, ū) and emphatic dots (ṣ, ḍ, ṭ, ẓ, ḥ)
 * and strips combining diacritical marks and modifier letters (ʿ, ʾ).
 * Ensures Arabic transliterations (e.g. "Sīrah", "Qur’ān", "Ḥadīth")
 * become clean ASCII keys without broken underscores.
 */

/**
 * Converts titles containing Arabic transliterations into clean ASCII snake_case database keys.
 * Example: "The Prophetic Biography (Sīrah) — Intake 2026" -> "the_prophetic_biography_sirah_intake_2026"
 */
export function generateBatchSlug(rawTitle) {
  if (!rawTitle) return '';

  return String(rawTitle)
    .normalize('NFD') // Decompose accented/macron characters (e.g. ī -> i + \u0304)
    .replace(/[\u0300-\u036f]/g, '') // Strip combining diacritical marks
    .replace(/[\u02BE\u02BF]/g, '') // Strip Unicode modifier letters (ʾ \u02be, ʿ \u02bf)
    .replace(/[’'`ʻʼʻˈ]/g, '') // Strip hamza/ayn apostrophes and accents (Qur'an -> quran)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_') // Collapse non-alphanumeric sequences into a single underscore
    .replace(/^_+|_+$/g, ''); // Trim leading and trailing underscores
}

/**
 * URL-friendly kebab-case slug generator.
 * Example: "Qur’ānic Arabic" -> "quranic-arabic"
 */
export function slugify(text) {
  if (!text) return '';

  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u02BE\u02BF]/g, '')
    .replace(/[’'`ʻʼʻˈ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
