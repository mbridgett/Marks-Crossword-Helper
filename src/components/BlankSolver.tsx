import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Grid3X3, X, SlidersHorizontal, BookOpen, Bookmark, BookmarkCheck, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { BlankMatchResult } from '../types';
import { solveBlanks } from '../utils/solver';
import { isWordSaved, toggleSaveWord, addHistoryItem } from '../utils/dictionaryService';

interface BlankSolverProps {
  words: string[];
  initialPattern?: string;
  onSelectWord: (word: string) => void;
  onWordSavedChange?: () => void;
}

export const BlankSolver: React.FC<BlankSolverProps> = ({
  words,
  initialPattern = 'C?O??',
  onSelectWord,
  onWordSavedChange,
}) => {
  const [wordLength, setWordLength] = useState<number>(() => {
    return initialPattern ? Math.max(3, Math.min(15, initialPattern.length)) : 5;
  });
  
  // Tiles array of length wordLength: each tile is either a letter 'A'-'Z' or empty string ''
  const [tiles, setTiles] = useState<string[]>(() => {
    const arr = Array(wordLength).fill('');
    if (initialPattern) {
      for (let i = 0; i < Math.min(wordLength, initialPattern.length); i++) {
        const ch = initialPattern[i].toUpperCase();
        if (ch >= 'A' && ch <= 'Z') arr[i] = ch;
      }
    }
    return arr;
  });

  const [activeTileIndex, setActiveTileIndex] = useState<number>(0);
  const [excludeLetters, setExcludeLetters] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  const tileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update tiles when wordLength changes
  const handleLengthChange = (newLen: number) => {
    const clamped = Math.max(2, Math.min(15, newLen));
    setWordLength(clamped);
    setTiles((prev) => {
      const next = Array(clamped).fill('');
      for (let i = 0; i < Math.min(clamped, prev.length); i++) {
        next[i] = prev[i];
      }
      return next;
    });
    setActiveTileIndex(0);
  };

  // Convert tiles into a pattern string (e.g. "C?O??")
  const currentPattern = useMemo(() => {
    return tiles.map((ch) => (ch ? ch : '?')).join('');
  }, [tiles]);

  // Execute solver
  const results = useMemo(() => {
    // Only search if there's at least one letter or specific pattern
    const hasAtLeastOneLetter = tiles.some((t) => t !== '');
    if (!hasAtLeastOneLetter) return [];

    return solveBlanks(currentPattern, words, {
      excludeLetters,
    });
  }, [currentPattern, words, excludeLetters, tiles]);

  // History tracking
  useEffect(() => {
    const hasLetters = tiles.some((t) => t !== '');
    if (hasLetters && results.length > 0) {
      const timer = setTimeout(() => {
        addHistoryItem(currentPattern, 'blanks', results.length);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPattern, results.length, tiles]);

  // Handle tile keyboard input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (tiles[index]) {
        // Clear current
        const next = [...tiles];
        next[index] = '';
        setTiles(next);
      } else if (index > 0) {
        // Move back and clear
        const next = [...tiles];
        next[index - 1] = '';
        setTiles(next);
        setActiveTileIndex(index - 1);
        tileInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setActiveTileIndex(index - 1);
      tileInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < wordLength - 1) {
      e.preventDefault();
      setActiveTileIndex(index + 1);
      tileInputRefs.current[index + 1]?.focus();
    } else if (e.key === ' ' || e.key === '?' || e.key === '.') {
      e.preventDefault();
      // Blank tile: clear and advance
      const next = [...tiles];
      next[index] = '';
      setTiles(next);
      if (index < wordLength - 1) {
        setActiveTileIndex(index + 1);
        tileInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleTileChange = (index: number, val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z]/g, '');
    const char = clean.slice(-1); // Take last typed letter

    const next = [...tiles];
    next[index] = char;
    setTiles(next);

    if (char && index < wordLength - 1) {
      setActiveTileIndex(index + 1);
      tileInputRefs.current[index + 1]?.focus();
    }
  };

  const handleClearAll = () => {
    setTiles(Array(wordLength).fill(''));
    setActiveTileIndex(0);
    tileInputRefs.current[0]?.focus();
  };

  const handleCopy = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  const handleToggleSave = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    toggleSaveWord(word, undefined, 'blanks');
    if (onWordSavedChange) onWordSavedChange();
  };

  // Quick patterns for inspiration
  const setPreset = (presetPattern: string) => {
    handleLengthChange(presetPattern.length);
    const newTiles = Array(presetPattern.length).fill('');
    for (let i = 0; i < presetPattern.length; i++) {
      const ch = presetPattern[i].toUpperCase();
      if (ch >= 'A' && ch <= 'Z') newTiles[i] = ch;
    }
    setTiles(newTiles);
  };

  return (
    <div id="blank-solver-view" className="space-y-4 pb-12">
      {/* Interactive Tile Grid Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Crossword Blank Pattern
            </span>
          </div>
          <button
            onClick={handleClearAll}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* Word Length Selector (Pills + Stepper) */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Word Length:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            <button
              onClick={() => handleLengthChange(wordLength - 1)}
              disabled={wordLength <= 2}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center justify-center transition"
            >
              -
            </button>
            {[3, 4, 5, 6, 7, 8, 9, 10].map((len) => (
              <button
                key={len}
                onClick={() => handleLengthChange(len)}
                className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition ${
                  wordLength === len
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {len}
              </button>
            ))}
            <button
              onClick={() => handleLengthChange(wordLength + 1)}
              disabled={wordLength >= 15}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center justify-center transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Tactile Crossword Boxes Row */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 py-2">
          {tiles.map((char, index) => {
            const isFocused = activeTileIndex === index;
            const hasLetter = !!char;

            return (
              <div
                key={index}
                onClick={() => {
                  setActiveTileIndex(index);
                  tileInputRefs.current[index]?.focus();
                }}
                className={`relative w-11 h-13 sm:w-13 sm:h-15 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isFocused
                    ? 'bg-slate-800 ring-2 ring-sky-400 border-sky-400 shadow-md shadow-sky-500/20'
                    : hasLetter
                    ? 'bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 text-slate-900 shadow-xs'
                    : 'bg-slate-950/80 border-2 border-dashed border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {/* Real hidden/visible input */}
                <input
                  ref={(el) => {
                    tileInputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={char}
                  onFocus={() => setActiveTileIndex(index)}
                  onChange={(e) => handleTileChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-full text-center font-black text-xl sm:text-2xl bg-transparent focus:outline-hidden select-all ${
                    hasLetter ? 'text-slate-900' : 'text-sky-300'
                  }`}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                />

                {/* Box number index in tiny font */}
                <span
                  className={`absolute top-1 left-1.5 text-[9px] font-bold ${
                    hasLetter ? 'text-slate-500' : 'text-slate-600'
                  }`}
                >
                  {index + 1}
                </span>

                {/* Underline indicator if blank */}
                {!hasLetter && (
                  <span className="absolute bottom-2 w-4 h-0.5 bg-slate-600 rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Helper Instructions & Pattern String */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Pattern: <strong className="font-mono text-sky-400 font-bold tracking-widest">{currentPattern}</strong>
          </span>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
          >
            <SlidersHorizontal className="w-3 h-3" />
            {showAdvanced ? 'Hide Filters' : 'Exclude Letters'}
          </button>
        </div>

        {/* Exclude Letters Filter */}
        {showAdvanced && (
          <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="exclude-input" className="font-semibold text-slate-300">
                Exclude Letters (ruled out)
              </label>
              {excludeLetters && (
                <button
                  onClick={() => setExcludeLetters('')}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              id="exclude-input"
              type="text"
              value={excludeLetters}
              onChange={(e) => setExcludeLetters(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              placeholder="e.g. QXZ (letters that won't appear in blanks)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-hidden focus:border-sky-500"
            />
          </div>
        )}

        {/* Quick Crossword Presets */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Try:
          </span>
          {['C?O??', 'B?A?K', '??E??', 'P??ZL?', 'T?A?E?'].map((preset) => (
            <button
              key={preset}
              onClick={() => setPreset(preset)}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 font-mono"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div>
        {!tiles.some((t) => t !== '') ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <Grid3X3 className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Tap any tile above and type known letters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Leave blank squares empty. Instant offline matching finds every valid crossword answer matching your pattern.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No matching words found for pattern "{currentPattern}"</p>
            <p className="text-xs text-slate-500">
              Check letter positions or remove excluded letter constraints.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300">
                {results.length} Suggestions for "{currentPattern}"
              </span>
              <span className="text-[11px] text-slate-400">
                Tap to view definition
              </span>
            </div>

            {/* Results Grid */}
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
                    {/* Word display with pattern letter highlighting */}
                    <div className="flex items-center gap-1 font-mono tracking-widest text-base min-w-0">
                      {item.word.split('').map((letter, idx) => {
                        const isKnownPatternLetter = tiles[idx] !== '';
                        return (
                          <span
                            key={idx}
                            className={`font-black ${
                              isKnownPatternLetter
                                ? 'text-sky-400 bg-sky-950/60 px-0.5 rounded-sm border-b-2 border-sky-400'
                                : 'text-slate-100 font-bold'
                            }`}
                          >
                            {letter}
                          </span>
                        );
                      })}
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
