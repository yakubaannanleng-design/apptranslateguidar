/**
 * Normalisation partagée par le dictionnaire et le moteur de traduction.
 *
 * Particularités guidar : les caractères ŋ, ɗ, ə ne sont pas décomposés par
 * Unicode NFD et sont donc préservés. Les diacritiques latins (accents
 * français) sont retirés pour rendre la recherche tolérante.
 */

const APOSTROPHES = /[\u2018\u2019\u02BC`´]/g;

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "");
}

export function normalizeWord(value: string): string {
  return stripDiacritics(value)
    .replace(APOSTROPHES, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?"'()[\]{}«»…-]+|[\s.,;:!?"'()[\]{}«»…-]+$/g, "")
    .trim();
}

export function normalizeText(value: string): string {
  return value
    .replace(APOSTROPHES, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value).match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Remplace des expressions entières en respectant les limites de mots
 * (utile pour « comment ça va » sans casser « commentaire »).
 */
export function replaceWholePhrase(
  text: string,
  phrase: string,
  replacement: string,
): string {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(phrase)})(?=$|[^\\p{L}\\p{N}])`, "giu");
  return text.replace(pattern, (_match, prefix: string) => `${prefix}${replacement}`);
}
