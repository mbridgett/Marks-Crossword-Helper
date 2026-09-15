import React from 'react';
import { Shuffle, Grid3X3, BookOpen, Bookmark } from 'lucide-react';
import { SolverTab } from '../types';

interface BottomNavProps {
  activeTab: SolverTab;
  onTabChange: (tab: SolverTab) => void;
  savedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  savedCount,
}) => {
  const tabs = [
    {
      id: 'anagram' as SolverTab,
      label: 'Anagrams',
      icon: Shuffle,
    },
    {
      id: 'blanks' as SolverTab,
      label: 'Blanks',
      icon: Grid3X3,
    },
    {
      id: 'dictionary' as SolverTab,
      label: 'Dictionary',
      icon: BookOpen,
    },
    {
      id: 'saved' as SolverTab,
      label: 'Saved',
      icon: Bookmark,
      badge: savedCount > 0 ? savedCount : null,
    },
  ];

  return (
    <nav
      id="android-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-area-bottom shadow-lg"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 px-1 transition-all group"
            >
              {/* Android M3 pill indicator */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium mt-1 tracking-tight transition-colors ${
                  isActive ? 'text-sky-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
