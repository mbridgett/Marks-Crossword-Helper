import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, Sparkles, Volume2, Copy, Bookmark, BookmarkCheck, ArrowRight, BookA } from 'lucide-react';
import { DictionaryEntry, SolverTab, ThesaurusResult } from '../types';
import { getDefinition, getThesaurus, toggleSaveWord, isWordSaved, addHistoryItem } from '../utils/dictionaryService';
import { FAMOUS_CROSSWORDESE } from '../data/crosswordCore';

interface DictionaryViewProps {
  words: string[];
  initialWord?: string;
  onNavigateTab: (tab: SolverTab, query?: string) => void;
  onWordSavedChange?: () => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  words,
  initialWord = '',
  onNavigateTab,
  onWordSavedChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialWord);
  const [activeWord, setActiveWord] = useState<string>(initialWord || 'PEAK');
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [thesaurus, setThesaurus] = useState<ThesaurusResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'definition' | 'thesaurus'>('both');
  const [selectedLengthFilter, setSelectedLengthFilter] = useState<number | 'all'>('all');

  // Auto-complete suggestion matches as user types
  const cleanSearch = searchTerm.toUpperCase().trim();
  const suggestions = useMemo(() => {
    if (!cleanSearch || cleanSearch.length < 2) return [];
    const exact = cleanSearch;
    const matches: string[] = [];
    
    // Exact match first if in lexicon
    for (const w of words) {
      if (w.startsWith(exact)) {
        matches.push(w);
        if (matches.length >= 8) break;
      }
    }
    return matches;
  }, [cleanSearch, words]);

  // Load definition and thesaurus whenever activeWord changes
  useEffect(() => {
    if (!activeWord) return;
    const upper = activeWord.toUpperCase();
    setSaved(isWordSaved(upper));
    setIsLoading(true);

    Promise.all([
      getDefinition(upper),
      getThesaurus(upper)
    ]).then(([defRes, thesRes]) => {
      setEntry(defRes);
      setThesaurus(thesRes);
      setIsLoading(false);
      addHistoryItem(upper, 'dictionary', 1);
    });
  }, [activeWord]);

  // Compile all unique similar words
  const similarWordsList = useMemo(() => {
    const set = new Set<string>();
    if (thesaurus?.synonyms) {
      for (const s of thesaurus.synonyms) set.add(s.toUpperCase());
    }
    if (entry?.synonyms) {
      for (const s of entry.synonyms) set.add(s.toUpperCase());
    }
    if (thesaurus?.similarWords) {
      for (const s of thesaurus.similarWords) set.add(s.toUpperCase());
    }
    set.delete(activeWord.toUpperCase());
    return Array.from(set);
  }, [thesaurus, entry, activeWord]);

  // Group similar words by length for crossword solving
  const groupedSimilarWords = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const w of similarWordsList) {
      const len = w.length;
      const list = map.get(len) || [];
      list.push(w);
      map.set(len, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [similarWordsList]);

  // Filtered similar words by length chip
  const displayedSimilarWords = useMemo(() => {
    if (selectedLengthFilter === 'all') return similarWordsList;
    return similarWordsList.filter((w) => w.length === selectedLengthFilter);
  }, [similarWordsList, selectedLengthFilter]);

  const handleSelectWord = (word: string) => {
    setActiveWord(word.toUpperCase());
    setSearchTerm('');
    setSelectedLengthFilter('all');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanSearch) {
      setActiveWord(cleanSearch);
      setSearchTerm('');
      setSelectedLengthFilter('all');
    }
  };

  const handleToggleSave = () => {
    if (!activeWord) return;
    const isNowSaved = toggleSaveWord(
      activeWord,
      entry?.definitions[0] || 'Crossword entry',
      'dictionary'
    );
    setSaved(isNowSaved);
    if (onWordSavedChange) onWordSavedChange();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeWord);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeWord);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="dictionary-view" className="space-y-4 pb-12">
      {/* Search Bar Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <label htmlFor="dict-search-input" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            Dictionary & Thesaurus
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Offline Definitions & Similar Words
          </span>
        </label>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            id="dict-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type any word to check definitions & similar words..."
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-base font-semibold text-white placeholder:text-slate-500 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Real-time Autocomplete Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="mt-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSelectWord(suggestion)}
                className="w-full text-left px-3 py-2 text-xs font-bold tracking-wider text-slate-200 hover:text-sky-400 hover:bg-slate-900 rounded-lg transition flex items-center justify-between"
              >
                <span>{suggestion}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {suggestion.length} letters
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Word Display Card */}
      {activeWord && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                  {activeWord}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800/60">
                    {activeWord.length} letters
                  </span>
                </div>
              </div>

              {entry?.partOfSpeech && (
                <p className="text-xs font-medium italic text-sky-400 mt-1">
                  {entry.partOfSpeech}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleSpeak}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Pronounce"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title={copied ? "Copied!" : "Copy Word"}
              >
                <Copy className={`w-4 h-4 ${copied ? 'text-emerald-400' : ''}`} />
              </button>
              <button
                onClick={handleToggleSave}
                className={`p-2 rounded-lg hover:bg-slate-800 transition ${
                  saved ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
                title={saved ? "Remove from Saved" : "Save Word"}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Section View Mode Tabs (Both / Definition / Thesaurus) */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('both')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'both' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('definition')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                viewMode === 'definition' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Definitions
            </button>
            <button
              onClick={() => setViewMode('thesaurus')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                viewMode === 'thesaurus' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookA className="w-3.5 h-3.5" />
              Thesaurus ({similarWordsList.length})
            </button>
          </div>

          {/* Main Content */}
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Searching definition & thesaurus...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Crossword Clue Insight (if available) */}
              {entry?.crosswordNote && (viewMode === 'both' || viewMode === 'definition') && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-300 block mb-0.5">Crossword Clue Insight:</strong>
                    {entry.crosswordNote}
                  </div>
                </div>
              )}

              {/* Definitions Section */}
              {(viewMode === 'both' || viewMode === 'definition') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    Definitions
                  </h3>
                  {entry?.definitions && entry.definitions.length > 0 ? (
                    <ul className="space-y-2.5">
                      {entry.definitions.map((def, idx) => (
                        <li key={idx} className="text-sm text-slate-200 leading-relaxed pl-3 border-l-2 border-sky-500/50">
                          {def}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Word is recognized in the lexicon.
                    </p>
                  )}
                </div>
              )}

              {/* Dedicated Thesaurus / Similar Words Section */}
              {(viewMode === 'both' || viewMode === 'thesaurus') && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <BookA className="w-4 h-4 text-sky-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Thesaurus & Similar Words ({similarWordsList.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Tap any word to inspect
                    </span>
                  </div>

                  {similarWordsList.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No direct synonyms recorded yet for this entry.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Word length filter chips for crossword solvers */}
                      {groupedSimilarWords.length > 1 && (
                        <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
                          <button
                            onClick={() => setSelectedLengthFilter('all')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition ${
                              selectedLengthFilter === 'all'
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            All ({similarWordsList.length})
                          </button>
                          {groupedSimilarWords.map(([len, items]) => (
                            <button
                              key={len}
                              onClick={() => setSelectedLengthFilter(len)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition ${
                                selectedLengthFilter === len
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                              }`}
                            >
                              {len} Letters ({items.length})
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Similar words pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {displayedSimilarWords.map((syn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectWord(syn)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-sky-500/50 transition flex items-center gap-1.5 active:scale-95 group"
                            title={`Look up "${syn}"`}
                          >
                            <span className="font-semibold">{syn}</span>
                            <span className="text-[10px] text-sky-400 bg-sky-950/80 px-1 py-0.2 rounded font-mono">
                              {syn.length}L
                            </span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Crossword Solver Jump Links */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onNavigateTab('anagram', activeWord)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  Find Exact Anagrams of "{activeWord}"
                </button>
                <button
                  onClick={() =>
                    onNavigateTab(
                      'blanks',
                      activeWord.slice(0, 1) + '?'.repeat(Math.max(1, activeWord.length - 2)) + activeWord.slice(-1)
                    )
                  }
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  Find Patterns for {activeWord.length} letters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Famous Crosswordese Quick Guide */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Famous Crosswordese Words
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Essential travel cheat sheet</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          High-vowel words that appear constantly in crossword puzzles:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.values(FAMOUS_CROSSWORDESE).map((item) => (
            <button
              key={item.word}
              onClick={() => handleSelectWord(item.word)}
              className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                activeWord === item.word
                  ? 'bg-sky-950/60 border-sky-500 text-sky-200 shadow-xs'
                  : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold text-sm tracking-wider text-white">
                  {item.word}
                </span>
                <span className="text-[10px] text-sky-400 font-semibold bg-sky-950/80 px-1.5 py-0.2 rounded">
                  {item.word.length} letters
                </span>
              </div>
              <span className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                {item.definitions[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
