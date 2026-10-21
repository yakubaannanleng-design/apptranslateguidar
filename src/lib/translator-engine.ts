/**
 * Moteur de traduction hors-ligne à base de lexique pour le guidar (gidar).
 *
 * Ce n'est volontairement pas un modèle neuronal : le guidar est une langue à
 * faibles ressources et chaque paire doit être vérifiée par des locuteurs.
 * Le moteur applique une correspondance d'expressions (la plus longue d'abord)
 * puis mot à mot, en conservant la ponctuation et la casse approximative.
 */
import { normalizeText, normalizeWord, replaceWholePhrase } from "./text";

export const CORE_TRANSLATIONS: Record<string, Record<string, string>> = {
  "fr-guidar": {
    bonjour: "Goudia",
    bonsoir: "Goudia",
    salut: "Goudia",
    merci: "Goudia",
    "au revoir": "Goudia",
    papa: "Baba",
    maman: "Mama",
    frère: "Malama",
    sœur: "Malama",
    dieu: "Woula",
    eau: "Ine",
    viande: "Sla",
    homme: "Dewa",
    femme: "Moussa",
    enfant: "Ouzza",
    maison: "Ga",
    marché: "Maraki",
    travail: "Daba",
    "comment ça va": "Aga d'da ?",
    "je vais bien": "I d'da",
    "où vas-tu": "Ni da nan ?",
    "je vais au marché": "I da ga maraki",
    oui: "Iyo",
    non: "A'a",
  },
  "guidar-fr": {
    goudia: "Bonjour / Merci",
    baba: "Papa",
    mama: "Maman",
    malama: "Frère / Sœur",
    woula: "Dieu",
    ine: "Eau",
    sla: "Viande",
    dewa: "Homme",
    moussa: "Femme",
    ouzza: "Enfant",
    ga: "Maison",
    maraki: "Marché",
    daba: "Travail / Houe",
    "aga d'da": "Comment ça va ?",
    "i d'da": "Je vais bien",
    "ni da nan": "Où vas-tu ?",
    iyo: "Oui",
    "a'a": "Non",
  },
  "en-guidar": {
    hello: "Goudia",
    "good morning": "Goudia",
    "thank you": "Goudia",
    goodbye: "Goudia",
    father: "Baba",
    mother: "Mama",
    water: "Ine",
    meat: "Sla",
    man: "Dewa",
    woman: "Moussa",
    child: "Ouzza",
    house: "Ga",
    market: "Maraki",
    work: "Daba",
    yes: "Iyo",
    no: "A'a",
    "how are you": "Aga d'da ?",
    "i am fine": "I d'da",
  },
  "guidar-en": {
    goudia: "Hello / Thank you",
    baba: "Father",
    mama: "Mother",
    ine: "Water",
    sla: "Meat",
    dewa: "Man",
    moussa: "Woman",
    ouzza: "Child",
    ga: "House",
    maraki: "Market",
    daba: "Work",
    iyo: "Yes",
    "a'a": "No",
    "aga d'da": "How are you?",
    "i d'da": "I am fine",
  },
};

export const CORE_DIRECTIONS = Object.keys(CORE_TRANSLATIONS);

export function hasCoreDirection(source: string, target: string): boolean {
  return Boolean(CORE_TRANSLATIONS[`${source}-${target}`]);
}

/**
 * Traduit un mot ou une expression à partir du lexique embarqué.
 * Retourne null si aucune correspondance n'est trouvée pour la paire demandée.
 */
export function getCoreTranslation(
  word: string,
  source: string,
  target: string,
): string | null {
  const table = CORE_TRANSLATIONS[`${source}-${target}`];
  if (!table) return null;

  const normalized = normalizeText(word);
  if (!normalized) return null;

  const direct = table[normalizeWord(word)];
  if (direct) return direct;

  const phrases = Object.keys(table).sort(
    (a, b) => b.split(" ").length - a.split(" ").length,
  );

  let translated = word;
  let replaced = false;

  for (const phrase of phrases) {
    const next = replaceWholePhrase(translated, phrase, table[phrase]);
    if (next !== translated) {
      translated = next;
      replaced = true;
    }
  }

  return replaced ? translated : null;
}
