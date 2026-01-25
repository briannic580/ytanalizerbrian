import React, { useState, useEffect, useRef } from 'react';
import { IconSearch, IconHistory, IconSparkles, IconMic } from '../constants/icons';
import { getSuggestions } from '../services/suggestionService';

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch, placeholder }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('yt_search_history');
    if (saved) try { setHistory(JSON.parse(saved)); } catch (e) {}
  }, []);

  const addToHistory = (val: string) => {
    if (!val) return;
    const newHistory = [val, ...history.filter(h => h !== val)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('yt_search_history', JSON.stringify(newHistory));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.includes('http')) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await getSuggestions(query);
      setSuggestions(results);
    }, 300);
  }, [query]);

  const handleSelect = (val: string) => {
    setQuery(val);
    setShowDropdown(false);
    onSearch(val);
    addToHistory(val);
    setIsFocused(false);
  };

  return (
    <div className="flex w-full items-center gap-3 relative" style={{ zIndex: 110 }} ref={wrapperRef}>
      <div className="flex flex-1 items-center relative h-10">
        <div className={`flex flex-1 items-center h-full border rounded-2xl overflow-hidden transition-all duration-300 ${
          isFocused 
            ? 'bg-background border-primary ring-4 ring-primary/10 shadow-lg shadow-primary/5' 
            : 'bg-secondary border-border shadow-sm hover:shadow-md'
        }`}>
          <div className="pl-4 text-muted-foreground">
            <IconSearch className="w-4 h-4" />
          </div>
          <input
            className="w-full bg-transparent border-none text-foreground placeholder-muted-foreground focus:outline-none text-sm px-3 font-medium h-full"
            placeholder={placeholder || "Search channel, URL or topic..."}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
            onKeyDown={e => e.key === 'Enter' && handleSelect(query)}
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors mr-1 font-bold text-lg"
            >
              ×
            </button>
          )}

          {isFocused && showDropdown && (suggestions.length > 0 || history.length > 0) && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card rounded-2xl shadow-premium-lg border border-border z-[200] py-2 overflow-hidden animate-scale-in">
              {history.length > 0 && !query && (
                <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Recent Searches
                </div>
              )}
              {(!query ? history : suggestions).slice(0, 8).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent cursor-pointer text-foreground text-sm font-medium transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  {query ? (
                    <IconSparkles className="text-primary w-3.5 h-3.5" />
                  ) : (
                    <IconHistory className="text-muted-foreground w-4 h-4" />
                  )}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleSelect(query)}
          className="h-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl ml-2 font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
        >
          Analyze
        </button>
      </div>

      <div className="hidden lg:flex items-center justify-center w-10 h-10 bg-secondary border border-border rounded-2xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer">
        <IconMic className="w-4 h-4" />
      </div>
    </div>
  );
};

export default SearchBar;
