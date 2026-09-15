import { DictionaryEntry, SavedWord, HistoryItem, ThesaurusResult } from '../types';
import { FAMOUS_CROSSWORDESE } from '../data/crosswordCore';
import { OFFLINE_THESAURUS } from '../data/crosswordThesaurus';

// In-memory caches
let cachedWordlist: string[] | null = null;
const letterDictCache = new Map<string, Record<string, string>>();
const customCache = new Map<string, DictionaryEntry>();
const thesaurusCache = new Map<string, ThesaurusResult>();

// LocalStorage keys
const SAVED_WORDS_KEY = 'cw_saved_words_v1';
const HISTORY_KEY = 'cw_history_v1';
const LOCAL_DICT_CACHE_KEY = 'cw_custom_dict_cache_v1';
const LOCAL_THESAURUS_CACHE_KEY = 'cw_thesaurus_cache_v1';

// Load stored custom entries from localStorage
try {
  const stored = localStorage.getItem(LOCAL_DICT_CACHE_KEY);
  if (stored) {
    const parsed: Record<string, DictionaryEntry> = JSON.parse(stored);
    for (const [k, v] of Object.entries(parsed)) {
      customCache.set(k.toUpperCase(), v);
    }
  }
} catch {
  // Ignore in private mode or SSR
}

// Load stored thesaurus entries from localStorage
try {
  const storedThesaurus = localStorage.getItem(LOCAL_THESAURUS_CACHE_KEY);
  if (storedThesaurus) {
    const parsedThesaurus: Record<string, ThesaurusResult> = JSON.parse(storedThesaurus);
    for (const [k, v] of Object.entries(parsedThesaurus)) {
      thesaurusCache.set(k.toUpperCase(), v);
    }
  }
} catch {
  // Ignore in private mode or SSR
}

export async function getWordlist(): Promise<string[]> {
  if (cachedWordlist && cachedWordlist.length > 0) {
    return cachedWordlist;
  }

  try {
    const res = await fetch('/data/words.json');
    if (!res.ok) throw new Error('Failed to load words.json');
    const words: string[] = await res.json();
    cachedWordlist = words;
    return words;
  } catch (err) {
    console.warn('Could not load /data/words.json, falling back to core lexicon', err);
    // Fallback minimal crossword words
    const fallback = Object.keys(FAMOUS_CROSSWORDESE);
    cachedWordlist = fallback;
    return fallback;
  }
}

export async function getDefinition(rawWord: string): Promise<DictionaryEntry | null> {
  const word = rawWord.trim().toUpperCase();
  if (!word) return null;

  // 1. Check curated crosswordese first
  if (FAMOUS_CROSSWORDESE[word]) {
    return FAMOUS_CROSSWORDESE[word];
  }

  // 2. Check local custom cache (from previous online lookups or notes)
  if (customCache.has(word)) {
    return customCache.get(word)!;
  }

  const firstLetter = word[0];
  if (!firstLetter || !/^[A-Z]$/.test(firstLetter)) return null;

  // 3. Check loaded letter dictionary
  const lowerLetter = firstLetter.toLowerCase();
  let dict = letterDictCache.get(lowerLetter);

  if (!dict) {
    try {
      const res = await fetch(`/data/dict/${lowerLetter}.json`);
      if (res.ok) {
        dict = await res.json();
        if (dict) {
          letterDictCache.set(lowerLetter, dict);
        }
      }
    } catch (e) {
      console.warn(`Could not load /data/dict/${lowerLetter}.json`, e);
    }
  }

  if (dict && dict[word]) {
    const defText = dict[word];
    const extracted = extractWebsterSynonyms(defText);
    const offlineSyns = OFFLINE_THESAURUS[word] || [];
    const allSyns = Array.from(new Set([...extracted, ...offlineSyns]));
    const entry: DictionaryEntry = {
      word,
      definitions: [defText],
      synonyms: allSyns.length > 0 ? allSyns : undefined,
      source: 'offline-webster'
    };
    return entry;
  }

  // 4. Try stemming / root forms (e.g. PLURALS with S/ES, PAST TENSE with ED, GERUNDS with ING)
  const stemmed = tryStemming(word);
  if (stemmed && dict && dict[stemmed]) {
    const defText = dict[stemmed];
    const extracted = extractWebsterSynonyms(defText);
    const offlineSyns = OFFLINE_THESAURUS[word] || OFFLINE_THESAURUS[stemmed] || [];
    const allSyns = Array.from(new Set([...extracted, ...offlineSyns]));
    return {
      word,
      definitions: [`(Form of ${stemmed}): ${defText}`],
      synonyms: allSyns.length > 0 ? allSyns : undefined,
      source: 'offline-webster'
    };
  }

  // 5. If online, attempt free dictionary API and cache locally
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (Array.isArray(data) && data[0]) {
          const first = data[0];
          const defs: string[] = [];
          const syns: string[] = [...(OFFLINE_THESAURUS[word] || [])];
          let partOfSpeech = '';

          for (const meaning of first.meanings || []) {
            if (!partOfSpeech && meaning.partOfSpeech) {
              partOfSpeech = meaning.partOfSpeech;
            }
            for (const d of meaning.definitions || []) {
              if (d.definition) defs.push(d.definition);
              if (d.synonyms && Array.isArray(d.synonyms)) {
                for (const s of d.synonyms) {
                  syns.push(s.toUpperCase());
                }
              }
            }
          }

          const entry: DictionaryEntry = {
            word,
            partOfSpeech: partOfSpeech || undefined,
            definitions: defs.slice(0, 4),
            synonyms: Array.from(new Set(syns)).slice(0, 10),
            source: 'online'
          };

          // Save to custom cache
          customCache.set(word, entry);
          saveCustomCache();
          return entry;
        }
      }
    } catch {
      // Ignore network errors in offline environment
    }
  }

  // Fallback placeholder entry for valid words without full definition text
  const offlineSyns = OFFLINE_THESAURUS[word] || [];
  return {
    word,
    definitions: ["Standard English crossword vocabulary word."],
    synonyms: offlineSyns.length > 0 ? offlineSyns : undefined,
    source: 'offline-core'
  };
}

export function extractWebsterSynonyms(text: string): string[] {
  if (!text) return [];
  const match = text.match(/(?:Syn\.\s*--?|Synonyms?:)\s*([^\n\r.]+)/i);
  if (!match || !match[1]) return [];

  const rawList = match[1].split(/[,;]/);
  const synonyms: string[] = [];
  for (const item of rawList) {
    const cleaned = item
      .replace(/^To\s+/i, '')
      .replace(/[^A-Za-z\s-]/g, '')
      .trim()
      .toUpperCase();
    if (cleaned.length >= 2 && cleaned.length <= 24 && !synonyms.includes(cleaned)) {
      synonyms.push(cleaned);
    }
  }
  return synonyms;
}

export async function getThesaurus(rawWord: string): Promise<ThesaurusResult> {
  const word = rawWord.trim().toUpperCase();
  if (!word) {
    return { word: '', synonyms: [], source: 'offline-thesaurus' };
  }

  // 1. Check in-memory thesaurus cache
  if (thesaurusCache.has(word)) {
    return thesaurusCache.get(word)!;
  }

  const collectedSynonyms: string[] = [];
  const similarWords: string[] = [];

  // 2. Check curated offline thesaurus
  if (OFFLINE_THESAURUS[word]) {
    collectedSynonyms.push(...OFFLINE_THESAURUS[word]);
  }

  // 3. Check famous crosswordese
  if (FAMOUS_CROSSWORDESE[word]?.synonyms) {
    for (const s of FAMOUS_CROSSWORDESE[word].synonyms!) {
      const u = s.toUpperCase().trim();
      if (u && !collectedSynonyms.includes(u)) {
        collectedSynonyms.push(u);
      }
    }
  }

  // 4. Also check definition entry for synonyms or Webster Syn.
  const defEntry = await getDefinition(word);
  if (defEntry?.synonyms) {
    for (const s of defEntry.synonyms) {
      const u = s.toUpperCase().trim();
      if (u && !collectedSynonyms.includes(u)) {
        collectedSynonyms.push(u);
      }
    }
  }
  if (defEntry?.definitions) {
    for (const d of defEntry.definitions) {
      const websterSyns = extractWebsterSynonyms(d);
      for (const ws of websterSyns) {
        if (!collectedSynonyms.includes(ws)) {
          collectedSynonyms.push(ws);
        }
      }
    }
  }

  // 5. If online, fetch from Datamuse (ideal for crossword solvers)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const lowerWord = word.toLowerCase();
      const [synRes, mlRes] = await Promise.allSettled([
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(lowerWord)}&max=25`),
        fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(lowerWord)}&max=20`)
      ]);

      if (synRes.status === 'fulfilled' && synRes.value.ok) {
        const data: { word: string; score: number }[] = await synRes.value.json();
        for (const item of data) {
          const w = item.word.toUpperCase().replace(/[^A-Z]/g, '');
          if (w && w !== word && !collectedSynonyms.includes(w)) {
            collectedSynonyms.push(w);
          }
        }
      }

      if (mlRes.status === 'fulfilled' && mlRes.value.ok) {
        const data: { word: string; score: number }[] = await mlRes.value.json();
        for (const item of data) {
          const w = item.word.toUpperCase().replace(/[^A-Z]/g, '');
          if (w && w !== word && !collectedSynonyms.includes(w) && !similarWords.includes(w)) {
            similarWords.push(w);
          }
        }
      }
    } catch {
      // Offline fallback
    }
  }

  const result: ThesaurusResult = {
    word,
    synonyms: Array.from(new Set(collectedSynonyms)),
    similarWords: Array.from(new Set(similarWords)).slice(0, 15),
    source: collectedSynonyms.length > 0 ? (OFFLINE_THESAURUS[word] ? 'offline-thesaurus' : 'cached') : 'offline-thesaurus'
  };

  thesaurusCache.set(word, result);
  saveThesaurusCache();
  return result;
}

function saveThesaurusCache() {
  try {
    const obj: Record<string, ThesaurusResult> = {};
    thesaurusCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(LOCAL_THESAURUS_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

function tryStemming(word: string): string | null {
  if (word.endsWith('S') && word.length > 3) {
    return word.slice(0, -1);
  }
  if (word.endsWith('ED') && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith('ING') && word.length > 5) {
    return word.slice(0, -3);
  }
  if (word.endsWith('LY') && word.length > 4) {
    return word.slice(0, -2);
  }
  return null;
}

function saveCustomCache() {
  try {
    const obj: Record<string, DictionaryEntry> = {};
    customCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(LOCAL_DICT_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // quota exceeded or private mode
  }
}

// Saved words management
export function getSavedWords(): SavedWord[] {
  try {
    const data = localStorage.getItem(SAVED_WORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isWordSaved(word: string): boolean {
  const upper = word.toUpperCase();
  return getSavedWords().some(s => s.word === upper);
}

export function toggleSaveWord(word: string, preview?: string, sourceTab?: 'anagram' | 'blanks' | 'dictionary'): boolean {
  const upper = word.toUpperCase();
  const saved = getSavedWords();
  const index = saved.findIndex(s => s.word === upper);
  let isNowSaved = false;

  if (index >= 0) {
    saved.splice(index, 1);
    isNowSaved = false;
  } else {
    saved.unshift({
      word: upper,
      dateAdded: Date.now(),
      definitionPreview: preview,
      sourceTab
    });
    isNowSaved = true;
  }

  try {
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(saved));
  } catch (e) {
    console.error(e);
  }

  return isNowSaved;
}

// History management
export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addHistoryItem(query: string, tab: 'anagram' | 'blanks' | 'dictionary', resultCount: number) {
  if (!query.trim()) return;
  const history = getHistory();
  const filtered = history.filter(h => !(h.query.toUpperCase() === query.toUpperCase() && h.tab === tab));
  
  filtered.unshift({
    id: `${Date.now()}-${Math.random()}`,
    query: query.toUpperCase(),
    tab,
    timestamp: Date.now(),
    resultCount
  });

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch {
    // Ignore
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
