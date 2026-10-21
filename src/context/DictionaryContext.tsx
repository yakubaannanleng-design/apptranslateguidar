import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { TranslationEntry } from "../lib/languages";
import { getCoreTranslation } from "../lib/translator-engine";
import { normalizeWord, parseCsv, toCsv } from "../lib/text";

interface SyncStatus {
  connected: boolean;
  lastSyncAt: number | null;
  syncing: boolean;
  error: string | null;
}

export interface SyncResult {
  ok: boolean;
  error?: string;
}

type ImportMode = "replace" | "merge";

interface DictionaryContextType {
  dictionary: TranslationEntry[];
  addEntry: (entry: Omit<TranslationEntry, "id" | "createdAt">) => TranslationEntry;
  updateEntry: (id: string, patch: Partial<Omit<TranslationEntry, "id">>) => void;
  removeEntry: (id: string) => void;
  findTranslation: (word: string, sourceLang: string, targetLang: string) => string | undefined;
  isLoaded: boolean;
  clearDictionary: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  autoSync: boolean;
  setAutoSync: (v: boolean) => void;
  syncStatus: SyncStatus;
  testServerConnection: () => Promise<void>;
  syncWithServer: () => Promise<SyncResult>;
  exportToJson: () => void;
  exportToCsv: () => void;
  importFromJson: (jsonString: string, mode?: ImportMode) => ImportMode | null;
  importFromCsv: (csvString: string, mode?: ImportMode) => ImportMode | null;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

const STORAGE_KEY = "tradai_dictionary_v2";
const SERVER_URL_KEY = "tradai_server_url";
const AUTO_SYNC_KEY = "tradai_auto_sync";
const DEFAULT_SERVER_URL = "http://localhost:8787";

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID exige un contexte sécurisé (https/localhost).
  return `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeServerUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function entryKey(entry: Pick<TranslationEntry, "sourceWord" | "sourceLang" | "targetLang">): string {
  return `${entry.sourceLang}|${entry.targetLang}|${normalizeWord(entry.sourceWord)}`;
}

function sanitizeEntry(value: unknown): TranslationEntry | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.sourceWord !== "string" ||
    typeof candidate.targetWord !== "string" ||
    typeof candidate.sourceLang !== "string" ||
    typeof candidate.targetLang !== "string"
  ) {
    return null;
  }
  if (!candidate.sourceWord.trim() || !candidate.targetWord.trim()) return null;

  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : createId(),
    sourceLang: candidate.sourceLang,
    sourceWord: candidate.sourceWord.trim(),
    targetLang: candidate.targetLang,
    targetWord: candidate.targetWord.trim(),
    createdAt:
      typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt)
        ? candidate.createdAt
        : Date.now(),
  };
}

function mergeDictionaries(
  base: TranslationEntry[],
  incoming: TranslationEntry[],
): TranslationEntry[] {
  const byKey = new Map<string, TranslationEntry>();
  for (const entry of base) byKey.set(entryKey(entry), entry);
  for (const entry of incoming) byKey.set(entryKey(entry), entry);
  return Array.from(byKey.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
  const [dictionary, setDictionary] = useState<TranslationEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverUrl, setServerUrlState] = useState(
    () => localStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL,
  );
  const [autoSync, setAutoSyncState] = useState(
    () => localStorage.getItem(AUTO_SYNC_KEY) === "true",
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    lastSyncAt: null,
    syncing: false,
    error: null,
  });

  const setServerUrl = useCallback((url: string) => {
    setServerUrlState(url);
    setSyncStatus((prev) => ({ ...prev, connected: false, error: null }));
  }, []);

  const setAutoSync = useCallback((value: boolean) => {
    setAutoSyncState(value);
  }, []);

  const pushToServer = useCallback(
    async (data: TranslationEntry[]): Promise<SyncResult> => {
      const baseUrl = normalizeServerUrl(serverUrl);
      if (!baseUrl) return { ok: false, error: "Aucune URL de serveur configurée." };

      setSyncStatus((prev) => ({ ...prev, syncing: true, error: null }));
      try {
        const response = await fetch(`${baseUrl}/translations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setSyncStatus({
          connected: true,
          lastSyncAt: Date.now(),
          syncing: false,
          error: null,
        });
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSyncStatus({ connected: false, lastSyncAt: null, syncing: false, error: message });
        return { ok: false, error: message };
      }
    },
    [serverUrl],
  );

  const pullFromServer = useCallback(async (): Promise<TranslationEntry[] | null> => {
    const baseUrl = normalizeServerUrl(serverUrl);
    if (!baseUrl) return null;

    setSyncStatus((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const response = await fetch(`${baseUrl}/translations`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Réponse serveur invalide.");
      const entries = data
        .map(sanitizeEntry)
        .filter((entry): entry is TranslationEntry => entry !== null);
      setSyncStatus({
        connected: true,
        lastSyncAt: Date.now(),
        syncing: false,
        error: null,
      });
      return entries;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncStatus({ connected: false, lastSyncAt: null, syncing: false, error: message });
      return null;
    }
  }, [serverUrl]);

  // Chargement initial depuis le navigateur.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDictionary(
            parsed
              .map(sanitizeEntry)
              .filter((entry): entry is TranslationEntry => entry !== null),
          );
        }
      } catch (error) {
        console.error("Dictionnaire local illisible", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Persistance locale + synchronisation automatique.
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionary));
    if (autoSync && normalizeServerUrl(serverUrl)) {
      void pushToServer(dictionary);
    }
  }, [dictionary, isLoaded, autoSync, serverUrl, pushToServer]);

  useEffect(() => {
    localStorage.setItem(SERVER_URL_KEY, serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    localStorage.setItem(AUTO_SYNC_KEY, String(autoSync));
  }, [autoSync]);

  const addEntry = useCallback(
    (entry: Omit<TranslationEntry, "id" | "createdAt">) => {
      const key = entryKey(entry);
      const existing = dictionary.find((item) => entryKey(item) === key);
      if (existing) {
        return existing;
      }

      const newEntry: TranslationEntry = {
        ...entry,
        sourceWord: entry.sourceWord.trim(),
        targetWord: entry.targetWord.trim(),
        id: createId(),
        createdAt: Date.now(),
      };
      setDictionary((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    [dictionary],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<TranslationEntry, "id">>) => {
      setDictionary((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                ...patch,
                sourceWord: (patch.sourceWord ?? entry.sourceWord).trim(),
                targetWord: (patch.targetWord ?? entry.targetWord).trim(),
              }
            : entry,
        ),
      );
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setDictionary((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearDictionary = useCallback(() => {
    setDictionary([]);
  }, []);

  const findTranslation = useCallback(
    (word: string, sourceLang: string, targetLang: string) => {
      const normalizedWord = normalizeWord(word);
      if (!normalizedWord) return undefined;

      const preciseMatch = dictionary.find(
        (entry) =>
          normalizeWord(entry.sourceWord) === normalizedWord &&
          entry.sourceLang === sourceLang &&
          entry.targetLang === targetLang,
      );
      if (preciseMatch) return preciseMatch.targetWord;

      if (targetLang === "guidar") {
        const broadMatch = dictionary.find(
          (entry) =>
            normalizeWord(entry.sourceWord) === normalizedWord &&
            entry.targetLang === "guidar",
        );
        if (broadMatch) return broadMatch.targetWord;
      }

      return getCoreTranslation(normalizedWord, sourceLang, targetLang) ?? undefined;
    },
    [dictionary],
  );

  const testServerConnection = useCallback(async () => {
    const baseUrl = normalizeServerUrl(serverUrl);
    if (!baseUrl) {
      setSyncStatus((prev) => ({ ...prev, error: "Veuillez entrer une URL de serveur." }));
      return;
    }

    setSyncStatus((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (!response.ok) throw new Error(`Réponse HTTP ${response.status}`);
      setSyncStatus({ connected: true, lastSyncAt: null, syncing: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncStatus({ connected: false, lastSyncAt: null, syncing: false, error: message });
    }
  }, [serverUrl]);

  const syncWithServer = useCallback(async (): Promise<SyncResult> => {
    const remote = await pullFromServer();
    if (remote === null) {
      return { ok: false, error: "Impossible de récupérer le dictionnaire distant." };
    }
    const merged = mergeDictionaries(remote, dictionary);
    setDictionary(merged);
    return pushToServer(merged);
  }, [pullFromServer, pushToServer, dictionary]);

  const exportToJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(dictionary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dictionnaire-guidar-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [dictionary]);

  const exportToCsv = useCallback(() => {
    const blob = new Blob([toCsv(dictionary)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dictionnaire-guidar-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [dictionary]);

  const importFromJson = useCallback(
    (jsonString: string, mode: ImportMode = "replace"): ImportMode | null => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed)) throw new Error("Le fichier doit contenir un tableau JSON.");
        const entries = parsed
          .map(sanitizeEntry)
          .filter((entry): entry is TranslationEntry => entry !== null);
        if (entries.length === 0) throw new Error("Aucune entrée valide dans le fichier.");

        setDictionary((prev) =>
          mode === "merge" ? mergeDictionaries(prev, entries) : entries,
        );
        setSyncStatus((prev) => ({ ...prev, error: null }));
        return mode;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSyncStatus((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [],
  );

  const importFromCsv = useCallback(
    (csvString: string, mode: ImportMode = "replace"): ImportMode | null => {
      try {
        const parsed = parseCsv(csvString);
        if (parsed.length === 0) throw new Error("Aucune ligne valide dans le CSV.");

        const entries = parsed
          .map((row) =>
            sanitizeEntry({
              sourceLang: row.sourceLang,
              sourceWord: row.sourceWord,
              targetLang: row.targetLang,
              targetWord: row.targetWord,
              createdAt: Date.now(),
            }),
          )
          .filter((entry): entry is TranslationEntry => entry !== null);

        if (entries.length === 0) throw new Error("Aucune entrée valide dans le CSV.");

        setDictionary((prev) =>
          mode === "merge" ? mergeDictionaries(prev, entries) : entries,
        );
        setSyncStatus((prev) => ({ ...prev, error: null }));
        return mode;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSyncStatus((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [],
  );

  return (
    <DictionaryContext.Provider
      value={{
        dictionary,
        addEntry,
        updateEntry,
        removeEntry,
        findTranslation,
        isLoaded,
        clearDictionary,
        serverUrl,
        setServerUrl,
        autoSync,
        setAutoSync,
        syncStatus,
        testServerConnection,
        syncWithServer,
        exportToJson,
        exportToCsv,
        importFromJson,
        importFromCsv,
      }}
    >
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (context === undefined) {
    throw new Error("useDictionary doit être utilisé dans un DictionaryProvider");
  }
  return context;
}
