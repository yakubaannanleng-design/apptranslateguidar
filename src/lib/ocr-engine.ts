/**
 * Moteur OCR basé sur tesseract.js, avec repli CDN si le paquet local
 * n'est pas installé.
 */
export const OCR_LANGUAGES = "fra+eng";

let workerPromise: Promise<any> | null = null;
let currentProgressHandler: ((progress: number) => void) | null = null;

const TESSERACT_MODULE = "tesseract.js";
const TESSERACT_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

async function loadTesseractModule(): Promise<any> {
  try {
    return await import(/* @vite-ignore */ TESSERACT_MODULE);
  } catch {
    return await import(/* @vite-ignore */ TESSERACT_CDN);
  }
}

async function getWorker(): Promise<any> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const module = await loadTesseractModule();
      const createWorker = module.createWorker || module.default?.createWorker;
      if (!createWorker) throw new Error("Moteur OCR indisponible.");
      return createWorker(OCR_LANGUAGES, 1, {
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
