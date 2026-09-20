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
  exactLength?: number;
}

export interface NearLengthMatchGroup {
  length: number;
  pattern: string;
  count: number;
  sampleWords: string[];
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
 * Solve crossword blanks/patterns like "C?O?S", "CR..S", "C_O_S", "S?A*G"
 * Supports ?, ., _ for single letter blanks, and * for 0+ letter wildcards.
 */
export function solveBlanks(
  patternInput: string,
  words: string[],
  options: BlankOptions = {}
): BlankMatchResult[] {
  const normalizedPattern = patternInput.toUpperCase().trim();
  if (!normalizedPattern) return [];

  // Pattern can use ?, ., or _ as blanks, and * as multi-letter wildcard
  const hasStar = normalizedPattern.includes('*');
  const targetLength = normalizedPattern.length;

  const excludedSet = new Set(
    (options.excludeLetters || '').toUpperCase().replace(/[^A-Z]/g, '').split('')
  );

  let regexPattern = '';
  for (let i = 0; i < normalizedPattern.length; i++) {
    const ch = normalizedPattern[i];
    if (ch === '?' || ch === '.' || ch === '_') {
      regexPattern += '[A-Z]';
    } else if (ch === '*') {
      regexPattern += '[A-Z]*';
    } else if (ch >= 'A' && ch <= 'Z') {
      regexPattern += ch;
    }
  }

  let regex: RegExp;
  try {
    regex = new RegExp(`^${regexPattern}$`);
  } catch {
    return [];
  }

  const results: BlankMatchResult[] = [];

  for (const word of words) {
    if (!hasStar) {
      if (options.exactLength ? word.length !== options.exactLength : word.length !== targetLength) {
        continue;
      }
    } else {
      if (word.length < 2 || word.length > 15) continue;
      if (options.exactLength && word.length !== options.exactLength) continue;
    }

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
        length: word.length,
        pattern: normalizedPattern,
        score: calculateWordScore(word)
      });
    }
  }

  // Sort: alphabetical
  results.sort((a, b) => a.word.localeCompare(b.word));

  return results;
}

/**
 * Check if nearby patterns (e.g. 1 fewer or 1 more ? wildcard) match words like STARTLING
 * when a user typed e.g. S?A??????G (10 chars with 7 blanks) instead of S?A?????G (9 chars with 6 blanks).
 */
export function getNearLengthPatternMatches(
  patternInput: string,
  words: string[]
): NearLengthMatchGroup[] {
  const clean = patternInput.toUpperCase().trim().replace(/[^A-Z?._*]/g, '');
  if (!clean || clean.length < 3) return [];

  const groups: NearLengthMatchGroup[] = [];
  const currentLength = clean.length;

  // 1. If pattern has 2 or more ? in a row, try with 1 fewer ? (shorter length)
  if (clean.includes('??')) {
    const shorterPattern = clean.replace('??', '?');
    if (shorterPattern.length !== currentLength) {
      const shorterMatches = solveBlanks(shorterPattern, words);
      if (shorterMatches.length > 0) {
        groups.push({
          length: shorterPattern.length,
          pattern: shorterPattern,
          count: shorterMatches.length,
          sampleWords: shorterMatches.map((m) => m.word).slice(0, 8),
        });
      }
    }
  }

  // 2. Try with 1 more ? (longer length) if pattern has at least one ?
  if (clean.includes('?') && clean.length <= 14) {
    const longerPattern = clean.replace('?', '??');
    if (longerPattern.length !== currentLength) {
      const longerMatches = solveBlanks(longerPattern, words);
      if (longerMatches.length > 0) {
        groups.push({
          length: longerPattern.length,
          pattern: longerPattern,
          count: longerMatches.length,
          sampleWords: longerMatches.map((m) => m.word).slice(0, 8),
        });
      }
    }
  }

  return groups;
}
