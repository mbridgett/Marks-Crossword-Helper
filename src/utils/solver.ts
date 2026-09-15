import { AnagramResult, BlankMatchResult } from '../types';
import { calculateWordScore } from '../data/crosswordCore';

export interface AnagramOptions {
  exactLengthOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
}

export interface BlankOptions {
  excludeLetters?: string;
}

/**
 * Solve anagrams given an input rack with letters and optional wildcards (?, *, .)
 */
export function solveAnagrams(
  rackInput: string,
  words: string[],
  options: AnagramOptions = {}
): AnagramResult[] {
  const cleanRack = rackInput.toUpperCase().replace(/\s+/g, '');
  if (!cleanRack) return [];

  // Count available letters and wildcards
  const rackCounts: Record<string, number> = {};
  let wildcards = 0;

  for (const ch of cleanRack) {
    if (ch === '?' || ch === '*' || ch === '.') {
      wildcards++;
    } else if (ch >= 'A' && ch <= 'Z') {
      rackCounts[ch] = (rackCounts[ch] || 0) + 1;
    }
  }

  const totalRackLength = Object.values(rackCounts).reduce((a, b) => a + b, 0) + wildcards;
  const {
    exactLengthOnly = true,
    minLength = totalRackLength,
    maxLength = totalRackLength,
    startsWith = '',
    endsWith = '',
    contains = ''
  } = options;

  const filterStart = startsWith.toUpperCase().trim();
  const filterEnd = endsWith.toUpperCase().trim();
  const filterContains = contains.toUpperCase().trim();

  const results: AnagramResult[] = [];

  for (const word of words) {
    const len = word.length;

    // Length criteria - exact anagram matching
    if (exactLengthOnly) {
      if (len !== totalRackLength) continue;
    } else {
      if (len < minLength || len > totalRackLength || (maxLength && len > maxLength)) {
        continue;
      }
    }

    // Affix filters
    if (filterStart && !word.startsWith(filterStart)) continue;
    if (filterEnd && !word.endsWith(filterEnd)) continue;
    if (filterContains && !word.includes(filterContains)) continue;

    // Check if word can be formed from rack
    let neededWildcards = 0;
    const wordCounts: Record<string, number> = {};

    for (let i = 0; i < len; i++) {
      const ch = word[i];
      wordCounts[ch] = (wordCounts[ch] || 0) + 1;
    }

    let possible = true;
    for (const [ch, needed] of Object.entries(wordCounts)) {
      const available = rackCounts[ch] || 0;
      if (needed > available) {
        neededWildcards += (needed - available);
        if (neededWildcards > wildcards) {
          possible = false;
          break;
        }
      }
    }

    if (possible && neededWildcards <= wildcards) {
      results.push({
        word,
        length: len,
        isExact: len === totalRackLength,
        score: calculateWordScore(word)
      });
    }
  }

  // Sort: alphabetical
  results.sort((a, b) => a.word.localeCompare(b.word));

  return results;
}

/**
 * Solve crossword blanks/patterns like "C?O?S", "CR..S", "C_O_S"
 */
export function solveBlanks(
  patternInput: string,
  words: string[],
  options: BlankOptions = {}
): BlankMatchResult[] {
  const normalizedPattern = patternInput.toUpperCase().trim();
  if (!normalizedPattern) return [];

  // Pattern can use ?, ., or _ as blanks
  // Replace all blanks with '.'
  const regexPattern = normalizedPattern.replace(/[?_]/g, '.');
  const targetLength = regexPattern.length;

  const excludedSet = new Set(
    (options.excludeLetters || '').toUpperCase().replace(/[^A-Z]/g, '').split('')
  );

  let regex: RegExp;
  try {
    regex = new RegExp(`^${regexPattern}$`);
  } catch {
    return [];
  }

  const results: BlankMatchResult[] = [];

  for (const word of words) {
    if (word.length !== targetLength) continue;

    // Excluded letters check
    if (excludedSet.size > 0) {
      let hasExcluded = false;
      for (const ch of word) {
        if (excludedSet.has(ch)) {
          hasExcluded = true;
          break;
        }
      }
      if (hasExcluded) continue;
    }

    // Regex check
    if (regex.test(word)) {
      results.push({
        word,
        length: targetLength,
        pattern: normalizedPattern,
        score: calculateWordScore(word)
      });
    }
  }

  // Sort: alphabetical
  results.sort((a, b) => a.word.localeCompare(b.word));

  return results;
}
