/**
 * Moteur OCR basé sur tesseract.js.
 *
 * Le guidar n'a pas de modèle d'apprentissage dédié : on utilise les modèles
 * latins français + anglais, qui couvrent l'alphabet latin étendu utilisé
 * notamment dans les documents bilingues. La qualité dépend fortement de la
 * photo (netteté, éclairage, perspective).
 */
export const OCR_LANGUAGES = "fra+eng";

let workerPromise: Promise<any> | null = null;
let currentProgressHandler: ((progress: number) => void) | null = null;

async function getWorker(): Promise<any> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const TESSERACT_MODULE = "tesseract.js";
      const module = await import(/* @vite-ignore */ TESSERACT_MODULE);
      return module.createWorker(OCR_LANGUAGES, 1, {
        logger: (message: any) => {
          if (message.status === "recognizing text" && currentProgressHandler) {
            currentProgressHandler(message.progress);
          }
        },
      });
    })();
  }
  return workerPromise;
}

export async function extractTextFromImage(
  imageFile: File | string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  currentProgressHandler = onProgress ?? null;
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(imageFile);
    return data.text.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Cannot find module") || message.includes("MODULE_NOT_FOUND")) {
      throw new Error(
        "Le moteur OCR n'est pas installé. Lancez `npm install tesseract.js` puis relancez l'application.",
      );
    }
    throw error;
  } finally {
    currentProgressHandler = null;
  }
}

export function splitIntoWords(text: string): string[] {
  return text
    .split(/[\s,.;:!?()"«»/\\[\]{}]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
}

/**
 * Aligne les mots source et cible.
 * Heuristique : si les nombres de mots sont proches, on aligne par position.
 */
export function alignWords(
  sourceWords: string[],
  targetWords: string[],
): { source: string; target: string }[] {
  const pairs: { source: string; target: string }[] = [];

  if (sourceWords.length === 0 || targetWords.length === 0) return pairs;

  if (sourceWords.length === targetWords.length) {
    for (let i = 0; i < sourceWords.length; i++) {
      pairs.push({ source: sourceWords[i], target: targetWords[i] });
    }
  } else {
    const ratio = targetWords.length / sourceWords.length;
    if (ratio > 0.5 && ratio < 2) {
      for (let i = 0; i < sourceWords.length; i++) {
        const targetIndex = Math.floor(i * ratio);
        if (targetWords[targetIndex]) {
          pairs.push({ source: sourceWords[i], target: targetWords[targetIndex] });
        }
      }
    }
  }

  return pairs;
}


