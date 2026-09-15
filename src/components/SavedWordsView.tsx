import React, { useState } from 'react';
import { Bookmark, History, Trash2, BookOpen, Shuffle, Grid3X3, ArrowRight } from 'lucide-react';
import { SavedWord, HistoryItem, SolverTab } from '../types';
import { getSavedWords, getHistory, clearHistory, toggleSaveWord } from '../utils/dictionaryService';

interface SavedWordsViewProps {
  onSelectWord: (word: string) => void;
  onNavigateTab: (tab: SolverTab, query?: string) => void;
  onWordSavedChange?: () => void;
}

export const SavedWordsView: React.FC<SavedWordsViewProps> = ({
  onSelectWord,
  onNavigateTab,
  onWordSavedChange,
}) => {
  const [subTab, setSubTab] = useState<'saved' | 'history'>('saved');
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => getSavedWords());
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => getHistory());

  const handleRemoveSaved = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    toggleSaveWord(word);
    setSavedWords(getSavedWords());
    if (onWordSavedChange) onWordSavedChange();
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistoryItems([]);
  };

  return (
    <div id="saved-words-view" className="space-y-4 pb-12">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => {
            setSubTab('saved');
            setSavedWords(getSavedWords());
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'saved'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Saved Words ({savedWords.length})
        </button>

        <button
          onClick={() => {
            setSubTab('history');
            setHistoryItems(getHistory());
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'history'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Recent Solves ({historyItems.length})
        </button>
      </div>

      {/* Saved Words Tab Content */}
      {subTab === 'saved' && (
        <div>
          {savedWords.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No saved words yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bookmark interesting words while solving anagrams, blank patterns, or dictionary lookups to keep them handy during your travel puzzle solving.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <span>{savedWords.length} Saved Words</span>
                <span>Tap for definition</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedWords.map((item) => (
                  <div
                    key={item.word}
                    onClick={() => onSelectWord(item.word)}
                    className="group bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer transition shadow-xs"
                  >
                    <div>
                      <h4 className="font-extrabold text-base tracking-wider text-slate-100 group-hover:text-sky-400 transition">
                        {item.word}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.word.length} letters
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab('anagram', item.word);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md hover:bg-slate-800 transition"
                        title="Anagrams"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWord(item.word);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md hover:bg-slate-800 transition"
                        title="Definition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleRemoveSaved(e, item.word)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab Content */}
      {subTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400">Search History</span>
            {historyItems.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {historyItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No recent queries</h3>
              <p className="text-xs text-slate-500">
                Your recent anagram and crossword blank searches will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onNavigateTab(h.tab, h.query)}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 text-sky-400">
                      {h.tab === 'anagram' ? (
                        <Shuffle className="w-4 h-4" />
                      ) : h.tab === 'blanks' ? (
                        <Grid3X3 className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-wider text-slate-200">
                          {h.query}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase px-1.5 py-0.5 rounded-sm bg-slate-800">
                          {h.tab}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {h.resultCount} results found
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
