import React, { useState, useMemo, useEffect } from 'react';
import { Shuffle, X, SlidersHorizontal, Bookmark, BookmarkCheck, BookOpen, Copy, Sparkles, Grid3X3, ArrowRight } from 'lucide-react';
import { solveAnagrams, solveBlanks, getNearLengthPatternMatches } from '../utils/solver';
import { isWordSaved, toggleSaveWord, addHistoryItem } from '../utils/dictionaryService';
import { SolverTab } from '../types';

interface AnagramSolverProps {
  words: string[];
  initialRack?: string;
  onSelectWord: (word: string) => void;
  onWordSavedChange?: () => void;
  onNavigateTab?: (tab: SolverTab, query?: string) => void;
}

type ResultMode = 'pattern' | 'anagram' | 'all';

export const AnagramSolver: React.FC<AnagramSolverProps> = ({
  words,
  initialRack = '',
  onSelectWord,
  onWordSavedChange,
  onNavigateTab,
}) => {
  const [rack, setRack] = useState(initialRack);
  const [startsWith, setStartsWith] = useState('');
  const [endsWith, setEndsWith] = useState('');
  const [contains, setContains] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [resultMode, setResultMode] = useState<ResultMode>('pattern');

  useEffect(() => {
    if (initialRack) {
      setRack(initialRack);
    }
  }, [initialRack]);

  // Clean and validate rack input
  const cleanRack = useMemo(() => {
    return rack.toUpperCase().replace(/[^A-Z?*._]/g, '');
  }, [rack]);

  const hasWildcards = useMemo(() => {
    return /[?*._]/.test(cleanRack);
  }, [cleanRack]);

  // Exact pattern matches (positional crossword slot matching: index 0 = S, index 2 = A, etc.)
  const patternMatches = useMemo(() => {
    if (!cleanRack || cleanRack.length < 2) return [];
    if (!hasWildcards) {
      // If no wildcards, checking exact word match
      return solveBlanks(cleanRack, words);
    }
    return solveBlanks(cleanRack, words);
  }, [cleanRack, words, hasWildcards]);

  // Anagram matches (permuting letters and wildcards)
  const anagramMatches = useMemo(() => {
    if (!cleanRack || cleanRack.length < 2) return [];
    return solveAnagrams(cleanRack, words, {
      exactLengthOnly: true,
      startsWith,
      endsWith,
      contains,
    });
  }, [cleanRack, words, startsWith, endsWith, contains]);

  // Near length pattern matches (e.g. if user typed S?A??????G with 7 blanks instead of S?A?????G with 6 blanks)
  const nearLengthGroups = useMemo(() => {
    if (!cleanRack || !hasWildcards) return [];
    return getNearLengthPatternMatches(cleanRack, words);
  }, [cleanRack, words, hasWildcards]);

  // Set of pattern words for fast lookup
  const patternWordSet = useMemo(() => {
    return new Set(patternMatches.map((m) => m.word));
  }, [patternMatches]);

  // Combined or filtered display list
  const displayResults = useMemo(() => {
    if (!cleanRack || cleanRack.length < 2) return [];

    if (!hasWildcards) {
      return anagramMatches.map((a) => ({
        word: a.word,
        isPattern: patternWordSet.has(a.word),
        isAnagram: true,
      }));
    }

    if (resultMode === 'pattern') {
      return patternMatches.map((p) => ({
        word: p.word,
        isPattern: true,
        isAnagram: true,
      }));
    }

    if (resultMode === 'anagram') {
      return anagramMatches.map((a) => ({
        word: a.word,
        isPattern: patternWordSet.has(a.word),
        isAnagram: true,
      }));
    }

    // 'all': Pattern matches first, followed by anagram-only matches
    const list: { word: string; isPattern: boolean; isAnagram: boolean }[] = [];
    const added = new Set<string>();

    for (const p of patternMatches) {
      list.push({ word: p.word, isPattern: true, isAnagram: true });
      added.add(p.word);
    }
    for (const a of anagramMatches) {
      if (!added.has(a.word)) {
        list.push({ word: a.word, isPattern: false, isAnagram: true });
        added.add(a.word);
      }
    }
    return list;
  }, [cleanRack, hasWildcards, resultMode, patternMatches, anagramMatches, patternWordSet]);

  // Record history on substantial query
  useEffect(() => {
    if (cleanRack.length >= 2 && (patternMatches.length > 0 || anagramMatches.length > 0)) {
      const count = Math.max(patternMatches.length, anagramMatches.length);
      const timer = setTimeout(() => {
        addHistoryItem(cleanRack, 'anagram', count);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cleanRack, patternMatches.length, anagramMatches.length]);

  // Shuffle the letters in rack for fresh inspiration
  const handleShuffle = () => {
    const chars = cleanRack.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setRack(chars.join(''));
  };

  const handleAddWildcard = () => {
    if (rack.length < 15) {
      setRack((prev) => prev + '?');
    }
  };

  const handleCopy = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  const handleToggleSave = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    toggleSaveWord(word, undefined, 'anagram');
    if (onWordSavedChange) onWordSavedChange();
  };

  const hasActiveFilters = Boolean(startsWith || endsWith || contains);

  return (
    <div id="anagram-solver-view" className="space-y-4 pb-12">
      {/* Input Section Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="rack-input" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-sky-400" />
            Crossword Anagram & Pattern Solver
          </label>
          <span className="text-[11px] text-slate-400">
            Use <code className="text-sky-300 font-mono font-bold bg-slate-800 px-1 py-0.5 rounded">?</code> for blanks
          </span>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <input
            id="rack-input"
            type="text"
            value={rack}
            onChange={(e) => setRack(e.target.value.toUpperCase())}
            placeholder="Type letters & pattern (e.g. S?A??????G, POSTAL, CR?SS)"
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-3 text-base sm:text-lg font-bold tracking-widest text-white placeholder:text-slate-500 placeholder:font-normal placeholder:tracking-normal focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
          />

          {rack && (
            <button
              onClick={() => setRack('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-md transition"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tactile Letter Tiles Display */}
        {cleanRack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 min-h-[48px] items-center">
            {cleanRack.split('').map((ch, idx) => {
              const isWildcard = ch === '?' || ch === '*' || ch === '.' || ch === '_';
              return (
                <div
                  key={idx}
                  className={`w-9 h-10 rounded-lg flex items-center justify-center font-black relative shadow-xs transition-transform hover:-translate-y-0.5 select-none ${
                    isWildcard
                      ? 'bg-amber-900/40 border border-amber-600 text-amber-300'
                      : 'bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 text-slate-900'
                  }`}
                >
                  <span className="text-base leading-none">{isWildcard ? '?' : ch}</span>
                </div>
              );
            })}
            <span className="ml-auto text-[11px] font-semibold text-slate-400">
              {cleanRack.length} letters
            </span>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddWildcard}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition active:scale-95 flex items-center gap-1"
            >
              + Blank Tile (?)
            </button>
            <button
              onClick={handleShuffle}
              disabled={cleanRack.length < 2}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-slate-700 transition active:scale-95 flex items-center gap-1"
            >
              <Shuffle className="w-3 h-3" />
              Shuffle
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTab && cleanRack.length >= 2 && (
              <button
                onClick={() => onNavigateTab('blanks', cleanRack)}
                className="px-2.5 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs font-semibold border border-sky-800/80 transition active:scale-95 flex items-center gap-1.5"
                title="View in Crossword Blanks Grid"
              >
                <Grid3X3 className="w-3 h-3 text-sky-400" />
                Crossword Grid
              </button>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                showFilters || hasActiveFilters
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Filters {hasActiveFilters ? '●' : ''}
            </button>
          </div>
        </div>

        {/* Collapsible Crossword Intersect Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400 text-[11px]">
              <span>Filter anagrams by intersecting crossword letters:</span>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setStartsWith('');
                    setEndsWith('');
                    setContains('');
                  }}
                  className="text-sky-400 hover:text-sky-300 font-medium"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Starts With</label>
                <input
                  type="text"
                  maxLength={4}
                  value={startsWith}
                  onChange={(e) => setStartsWith(e.target.value.toUpperCase())}
                  placeholder="e.g. ST"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-hidden focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ends With</label>
                <input
                  type="text"
                  maxLength={4}
                  value={endsWith}
                  onChange={(e) => setEndsWith(e.target.value.toUpperCase())}
                  placeholder="e.g. ING"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-hidden focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Contains</label>
                <input
                  type="text"
                  maxLength={5}
                  value={contains}
                  onChange={(e) => setContains(e.target.value.toUpperCase())}
                  placeholder="e.g. ART"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Near-Length Pattern Match Suggestion Banner (e.g. 9-letter STARTLING for S?A??????G) */}
      {hasWildcards && nearLengthGroups.length > 0 && (
        <div className="space-y-2">
          {nearLengthGroups.map((group) => (
            <div
              key={group.pattern}
              className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-2.5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Looking for <strong>{group.length}-letter</strong> words like{' '}
                  <strong className="text-white underline decoration-sky-400 underline-offset-2">
                    {group.sampleWords.find((w) => w === 'STARTLING') || group.sampleWords[0]}
                  </strong>? Found {group.count} words matching{' '}
                  <code className="font-mono font-bold bg-sky-900/60 text-sky-300 px-1 py-0.5 rounded">
                    {group.pattern}
                  </code>
                </span>
              </div>
              <button
                onClick={() => setRack(group.pattern)}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1 transition shrink-0 active:scale-95"
              >
                <span>Switch to {group.length} Letters</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Results View Mode Toggle (When wildcards are entered) */}
      {hasWildcards && cleanRack.length >= 2 && (
        <div className="flex items-center justify-between p-1 bg-slate-900/90 border border-slate-800 rounded-xl gap-1">
          <button
            onClick={() => setResultMode('pattern')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              resultMode === 'pattern'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Exact Pattern</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${resultMode === 'pattern' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {patternMatches.length}
            </span>
          </button>

          <button
            onClick={() => setResultMode('anagram')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              resultMode === 'anagram'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Anagrams</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${resultMode === 'anagram' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {anagramMatches.length}
            </span>
          </button>

          <button
            onClick={() => setResultMode('all')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              resultMode === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${resultMode === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {displayResults.length}
            </span>
          </button>
        </div>
      )}

      {/* Results Section */}
      <div>
        {cleanRack.length < 2 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <Shuffle className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Enter letters or pattern above</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Finds exact pattern matches (e.g. <code className="text-sky-400 font-bold">S?A??????G</code>) and anagrams instantly offline.
            </p>
          </div>
        ) : displayResults.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No matches found</p>
            <p className="text-xs text-slate-500">
              {hasWildcards && resultMode === 'pattern'
                ? `No words match pattern "${cleanRack}" exactly. Check the Anagrams tab or adjust letter positions.`
                : `No ${cleanRack.length}-letter words match all entered letters. Try adding a wildcard tile (?).`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header info bar with count */}
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>
                  {displayResults.length}{' '}
                  {hasWildcards
                    ? resultMode === 'pattern'
                      ? 'Exact Pattern Match'
                      : resultMode === 'anagram'
                      ? 'Anagram'
                      : 'Result'
                    : 'Exact Anagram'}
                  {displayResults.length === 1 ? '' : 's'}
                </span>
                <span className="text-slate-500 font-normal">({cleanRack.length} letters)</span>
              </div>
              <span className="text-[11px] text-slate-400">Tap word for definition & thesaurus</span>
            </div>

            {/* Word cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayResults.map((item) => {
                const saved = isWordSaved(item.word);
                const isCopied = copiedWord === item.word;

                return (
                  <div
                    key={item.word}
                    onClick={() => onSelectWord(item.word)}
                    className="group bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-base tracking-wider text-slate-100 group-hover:text-sky-400 transition truncate">
                        {item.word}
                      </span>
                      {hasWildcards && item.isPattern && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                          Exact Pattern
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Definition & Thesaurus Quick Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWord(item.word);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md hover:bg-slate-800 transition"
                        title="Definition & Thesaurus"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>

                      {/* Bookmark Icon */}
                      <button
                        onClick={(e) => handleToggleSave(e, item.word)}
                        className={`p-1.5 rounded-md hover:bg-slate-800 transition ${
                          saved ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={saved ? 'Remove from Saved' : 'Save Word'}
                      >
                        {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>

                      {/* Copy Icon */}
                      <button
                        onClick={(e) => handleCopy(e, item.word)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition"
                        title="Copy word"
                      >
                        <Copy className={`w-3.5 h-3.5 ${isCopied ? 'text-emerald-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
