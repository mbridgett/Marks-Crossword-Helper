export type SolverTab = 'anagram' | 'blanks' | 'dictionary' | 'saved';

export interface DictionaryEntry {
  word: string;
  partOfSpeech?: string;
  definitions: string[];
  synonyms?: string[];
  examples?: string[];
  crosswordNote?: string;
  source: 'offline-core' | 'offline-webster' | 'cached' | 'online';
}

export interface AnagramResult {
  word: string;
  length: number;
  isExact: boolean;
  score: number;
  definitionPreview?: string;
}

export interface BlankMatchResult {
  word: string;
  length: number;
  pattern: string;
  score: number;
  definitionPreview?: string;
}

export interface SavedWord {
  word: string;
  dateAdded: number;
  definitionPreview?: string;
  sourceTab?: 'anagram' | 'blanks' | 'dictionary';
}

export interface HistoryItem {
  id: string;
  query: string;
  tab: 'anagram' | 'blanks' | 'dictionary';
  timestamp: number;
  resultCount: number;
}

export interface ThesaurusResult {
  word: string;
  synonyms: string[];
  similarWords?: string[];
  source: 'offline-thesaurus' | 'offline-webster' | 'cached' | 'online';
}
