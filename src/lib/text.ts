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

export function toCsv(entries: { sourceLang: string; sourceWord: string; targetLang: string; targetWord: string }[]): string {
  const header = "sourceLang,sourceWord,targetLang,targetWord";
  const rows = entries.map((entry) =>
    [entry.sourceLang, entry.sourceWord, entry.targetLang, entry.targetWord]
      .map((value) => {
        const text = String(value ?? "");
        if (/[",\n\r]/.test(text)) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      })
      .join(","),
  );
  return [header, ...rows].join("\r\n");
}

export function parseCsv(text: string): { sourceLang: string; sourceWord: string; targetLang: string; targetWord: string }[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const rows: string[][] = [];
  for (const line of lines) {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    rows.push(cells);
  }

  const firstRow = rows[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = firstRow.includes("sourceword") || firstRow.includes("source_lang");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((cells) => {
      const [sourceLang = "", sourceWord = "", targetLang = "", targetWord = ""] = cells.map((cell) => cell.trim());
      return { sourceLang, sourceWord, targetLang, targetWord };
    })
    .filter((row) => row.sourceWord && row.targetWord);
}
