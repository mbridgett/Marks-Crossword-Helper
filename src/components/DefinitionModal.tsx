import React, { useEffect, useState } from 'react';
import { X, Bookmark, BookmarkCheck, Copy, Volume2, ArrowRight, BookOpen, Sparkles, BookA } from 'lucide-react';
import { DictionaryEntry, SolverTab, ThesaurusResult } from '../types';
import { getDefinition, getThesaurus, toggleSaveWord, isWordSaved } from '../utils/dictionaryService';

interface DefinitionModalProps {
  word: string | null;
  onClose: () => void;
  onNavigateTab?: (tab: SolverTab, query?: string) => void;
  onWordSavedChange?: () => void;
}

export const DefinitionModal: React.FC<DefinitionModalProps> = ({
  word,
  onClose,
  onNavigateTab,
  onWordSavedChange,
}) => {
  const [currentWord, setCurrentWord] = useState<string | null>(word);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [thesaurus, setThesaurus] = useState<ThesaurusResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentWord(word);
  }, [word]);

  useEffect(() => {
    if (!currentWord) {
      setEntry(null);
      setThesaurus(null);
      return;
    }

    const upper = currentWord.toUpperCase();
    setSaved(isWordSaved(upper));
    setIsLoading(true);

    Promise.all([
      getDefinition(upper),
      getThesaurus(upper)
    ]).then(([defRes, thesRes]) => {
      setEntry(defRes);
      setThesaurus(thesRes);
      setIsLoading(false);
    });
  }, [currentWord]);

  if (!currentWord) return null;

  const upper = currentWord.toUpperCase();

  const handleToggleSave = () => {
    const isNowSaved = toggleSaveWord(
      upper,
      entry?.definitions[0] || 'Crossword entry',
      'dictionary'
    );
    setSaved(isNowSaved);
    if (onWordSavedChange) onWordSavedChange();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(upper);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(upper);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Combine synonyms from entry and thesaurus service
  const allSimilarWords = Array.from(
    new Set([
      ...(thesaurus?.synonyms || []),
      ...(entry?.synonyms || []),
      ...(thesaurus?.similarWords || [])
    ])
  ).filter((w) => w.toUpperCase() !== upper);

  return (
    <div
      id="definition-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="definition-modal-content"
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle for mobile drawer feel */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-wider text-white">
                {upper}
              </h2>
              {/* Length Pill (no points display) */}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800/60">
                {upper.length} letters
              </span>
            </div>

            {entry?.partOfSpeech && (
              <p className="text-xs font-medium italic text-sky-400 mt-1">
                {entry.partOfSpeech}
              </p>
            )}
          </div>

          {/* Action Icons */}
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
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Fetching definition & thesaurus...</p>
            </div>
          ) : (
            <>
              {/* Crossword Tips / Famous Crosswordese Note if applicable */}
              {entry?.crosswordNote && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-300 block mb-0.5">Crossword Clue Insight:</strong>
                    {entry.crosswordNote}
                  </div>
                </div>
              )}

              {/* Definitions List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  Definitions
                </h4>
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
                    Word is recognized in the crossword lexicon.
                  </p>
                )}
              </div>

              {/* Thesaurus & Similar Words section with word lengths */}
              {allSimilarWords.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookA className="w-3.5 h-3.5 text-sky-400" />
                      Thesaurus & Similar Words ({allSimilarWords.length})
                    </h4>
                    <span className="text-[10px] text-slate-500">Tap word to look up</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {allSimilarWords.map((syn, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentWord(syn)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-sky-500/50 transition flex items-center gap-1.5 active:scale-95"
                        title={`Look up ${syn}`}
                      >
                        <span className="font-semibold">{syn}</span>
                        <span className="text-[10px] text-sky-400 bg-sky-950/80 px-1 py-0.2 rounded font-mono">
                          {syn.length}
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-linking shortcuts to other tools */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateTab) onNavigateTab('anagram', upper);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  Find Exact Anagrams of "{upper}"
                </button>
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateTab) onNavigateTab('blanks', upper.slice(0, 1) + '?'.repeat(Math.max(1, upper.length - 2)) + upper.slice(-1));
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  Find Patterns for "{upper.length}L"
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
