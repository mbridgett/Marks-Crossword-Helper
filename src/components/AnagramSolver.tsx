import React, { useState, useMemo, useEffect } from 'react';
import { Shuffle, X, SlidersHorizontal, Bookmark, BookmarkCheck, BookOpen, Copy } from 'lucide-react';
import { solveAnagrams } from '../utils/solver';
import { isWordSaved, toggleSaveWord, addHistoryItem } from '../utils/dictionaryService';

interface AnagramSolverProps {
  words: string[];
  initialRack?: string;
  onSelectWord: (word: string) => void;
  onWordSavedChange?: () => void;
}

export const AnagramSolver: React.FC<AnagramSolverProps> = ({
  words,
  initialRack = '',
  onSelectWord,
  onWordSavedChange,
}) => {
  const [rack, setRack] = useState(initialRack);
  const [startsWith, setStartsWith] = useState('');
  const [endsWith, setEndsWith] = useState('');
  const [contains, setContains] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  useEffect(() => {
    if (initialRack) {
      setRack(initialRack);
    }
  }, [initialRack]);

  // Clean and validate rack input
  const cleanRack = useMemo(() => {
    return rack.toUpperCase().replace(/[^A-Z?*.]/g, '');
  }, [rack]);

  // Execute solver - strictly exact anagrams matching the rack length
  const results = useMemo(() => {
    if (!cleanRack || cleanRack.length < 2) return [];
    const res = solveAnagrams(cleanRack, words, {
      exactLengthOnly: true,
      startsWith,
      endsWith,
      contains,
    });
    return res;
  }, [cleanRack, words, startsWith, endsWith, contains]);

  // Record history on substantial query
  useEffect(() => {
    if (cleanRack.length >= 2 && results.length > 0) {
      const timer = setTimeout(() => {
        addHistoryItem(cleanRack, 'anagram', results.length);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cleanRack, results.length]);

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
            Exact Anagram Solver
          </label>
          <span className="text-[11px] text-slate-400">
            Use <code className="text-sky-300 font-mono font-bold bg-slate-800 px-1 py-0.5 rounded">?</code> for blank
          </span>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <input
            id="rack-input"
            type="text"
            value={rack}
            onChange={(e) => setRack(e.target.value.toUpperCase())}
            placeholder="Type letters (e.g. SILENT, POSTAL, CR?SS)"
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

        {/* Tactile Letter Tiles Display (clean, no points) */}
        {cleanRack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 min-h-[48px] items-center">
            {cleanRack.split('').map((ch, idx) => {
              const isWildcard = ch === '?' || ch === '*' || ch === '.';
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showFilters || hasActiveFilters
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Intersect Filters {hasActiveFilters ? '●' : ''}
          </button>
        </div>

        {/* Collapsible Crossword Intersect Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400 text-[11px]">
              <span>Filter exact anagrams by intersecting crossword letters:</span>
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

            {/* Intersect letter constraints (Starts With / Ends With / Contains) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Starts With</label>
                <input
                  type="text"
                  maxLength={3}
                  value={startsWith}
                  onChange={(e) => setStartsWith(e.target.value.toUpperCase())}
                  placeholder="e.g. TR"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-hidden focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ends With</label>
                <input
                  type="text"
                  maxLength={3}
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
                  maxLength={4}
                  value={contains}
                  onChange={(e) => setContains(e.target.value.toUpperCase())}
                  placeholder="e.g. EA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div>
        {cleanRack.length < 2 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <Shuffle className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Enter letters above</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Finds exact anagrams of your letters instantly offline. Use <code className="text-sky-400 font-bold">?</code> for blank tiles.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No exact anagrams found</p>
            <p className="text-xs text-slate-500">
              No {cleanRack.length}-letter words match all entered letters exactly. Try adding a wildcard tile (<code className="text-sky-400">?</code>).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header info bar with count */}
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>{results.length} Exact Anagram{results.length === 1 ? '' : 's'}</span>
                <span className="text-slate-500 font-normal">({cleanRack.length} letters)</span>
              </div>
              <span className="text-[11px] text-slate-400">Tap word for definition & thesaurus</span>
            </div>

            {/* Word cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {results.map((item) => {
                const saved = isWordSaved(item.word);
                const isCopied = copiedWord === item.word;

                return (
                  <div
                    key={item.word}
                    onClick={() => onSelectWord(item.word)}
                    className="group bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-extrabold text-base tracking-wider text-slate-100 group-hover:text-sky-400 transition truncate">
                        {item.word}
                      </span>
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
