import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconHistory, IconSearch, IconX } from '../constants/icons';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  type: 'channel' | 'keyword' | 'playlist';
  resultCount?: number;
}

interface SearchHistoryPageProps {
  onSearch: (query: string) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const SearchHistoryPage: React.FC<SearchHistoryPageProps> = ({ onSearch, onToast }) => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'channel' | 'keyword' | 'playlist'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('yt_search_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  };

  const deleteItem = (timestamp: number) => {
    const newHistory = history.filter(h => h.timestamp !== timestamp);
    setHistory(newHistory);
    localStorage.setItem('yt_search_history_v2', JSON.stringify(newHistory));
    onToast('Item removed from history', 'success');
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem('yt_search_history_v2');
    onToast('History cleared', 'success');
  };

  const handleReplay = (query: string) => {
    onSearch(query);
  };

  const filteredHistory = history.filter(h => 
    filter === 'all' || h.type === filter
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'channel': return '📺';
      case 'playlist': return '📋';
      default: return '🔍';
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'channel': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'playlist': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
            <IconHistory className="w-6 h-6 text-primary" />
            Search History
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {history.length} searches recorded
          </p>
        </div>

        {history.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearAll}
            className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-bold hover:bg-destructive/20 transition-colors"
          >
            Clear All
          </motion.button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-secondary rounded-xl w-fit">
        {(['all', 'channel', 'keyword', 'playlist'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              filter === f
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* History List */}
      <AnimatePresence mode="popLayout">
        {filteredHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconHistory className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">
              {history.length === 0 
                ? 'No search history yet. Start analyzing to build your history.'
                : `No ${filter} searches found.`
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.timestamp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
                className="group flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/20 hover:shadow-md transition-all"
              >
                <div className="text-2xl">{getTypeIcon(item.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground truncate">{item.query}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getTypeBadgeStyle(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{formatDate(item.timestamp)}</span>
                    {item.resultCount && (
                      <>
                        <span className="opacity-30">•</span>
                        <span>{item.resultCount} results</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReplay(item.query)}
                    className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                    title="Search again"
                  >
                    <IconSearch className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteItem(item.timestamp)}
                    className="p-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
                    title="Remove"
                  >
                    <IconX className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchHistoryPage;

// Helper to add items to history (use in YouTubeAnalyzer)
export const addToSearchHistory = (
  query: string, 
  type: 'channel' | 'keyword' | 'playlist',
  resultCount?: number
): void => {
  const saved = localStorage.getItem('yt_search_history_v2');
  let history: SearchHistoryItem[] = [];
  
  if (saved) {
    try {
      history = JSON.parse(saved);
    } catch {
      // ignore parse errors
    }
  }

  // Remove duplicate if exists
  history = history.filter(h => h.query !== query);

  // Add new item at the beginning
  history.unshift({
    query,
    timestamp: Date.now(),
    type,
    resultCount
  });

  // Keep only last 50 items
  history = history.slice(0, 50);

  localStorage.setItem('yt_search_history_v2', JSON.stringify(history));
};
