/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AnagramSolver } from './components/AnagramSolver';
import { BlankSolver } from './components/BlankSolver';
import { DictionaryView } from './components/DictionaryView';
import { SavedWordsView } from './components/SavedWordsView';
import { DefinitionModal } from './components/DefinitionModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SolverTab } from './types';
import { getWordlist, getSavedWords } from './utils/dictionaryService';
import { FAMOUS_CROSSWORDESE } from './data/crosswordCore';

export default function App() {
  const [activeTab, setActiveTab] = useState<SolverTab>('anagram');
  const [words, setWords] = useState<string[]>(() => Object.keys(FAMOUS_CROSSWORDESE));
  const [isLoadingLexicon, setIsLoadingLexicon] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(() => getSavedWords().length);

  // Queries carried over between tabs
  const [anagramRack, setAnagramRack] = useState<string>('CROSSWORD');
  const [blankPattern, setBlankPattern] = useState<string>('C?O??');
  const [dictionaryWord, setDictionaryWord] = useState<string>('ALOE');

  // Load the comprehensive 83,000+ words offline lexicon
  useEffect(() => {
    let isMounted = true;
    getWordlist()
      .then((loadedWords) => {
        if (isMounted && loadedWords && loadedWords.length > 0) {
          setWords(loadedWords);
          setIsLoadingLexicon(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load wordlist:', err);
        if (isMounted) setIsLoadingLexicon(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshSavedCount = () => {
    setSavedCount(getSavedWords().length);
  };

  const handleNavigateTab = (tab: SolverTab, query?: string) => {
    setActiveTab(tab);
    if (query) {
      if (tab === 'anagram') setAnagramRack(query);
      else if (tab === 'blanks') setBlankPattern(query);
      else if (tab === 'dictionary') setDictionaryWord(query);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Offline Status Alert */}
      <OfflineIndicator />

      {/* Top App Bar Header */}
      <Header
        wordCount={words.length}
        isLoadingLexicon={isLoadingLexicon}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 pt-4 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'anagram' && (
            <motion.div
              key="anagram-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <AnagramSolver
                words={words}
                initialRack={anagramRack}
                onSelectWord={(word) => setSelectedWord(word)}
                onWordSavedChange={refreshSavedCount}
              />
            </motion.div>
          )}

          {activeTab === 'blanks' && (
            <motion.div
              key="blanks-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BlankSolver
                words={words}
                initialPattern={blankPattern}
                onSelectWord={(word) => setSelectedWord(word)}
                onWordSavedChange={refreshSavedCount}
              />
            </motion.div>
          )}

          {activeTab === 'dictionary' && (
            <motion.div
              key="dictionary-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <DictionaryView
                words={words}
                initialWord={dictionaryWord}
                onNavigateTab={handleNavigateTab}
                onWordSavedChange={refreshSavedCount}
              />
            </motion.div>
          )}

          {activeTab === 'saved' && (
            <motion.div
              key="saved-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <SavedWordsView
                onSelectWord={(word) => setSelectedWord(word)}
                onNavigateTab={handleNavigateTab}
                onWordSavedChange={refreshSavedCount}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Definition Modal for one-tap lookups anywhere */}
      <DefinitionModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        onNavigateTab={handleNavigateTab}
        onWordSavedChange={refreshSavedCount}
      />

      {/* Android Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        savedCount={savedCount}
      />
    </div>
  );
}
