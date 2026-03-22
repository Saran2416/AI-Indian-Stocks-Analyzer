'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  isLoading?: boolean;
}

export default function StockSearch({ onSelect, isLoading = false }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.quotes || []);
          setIsOpen((data.quotes || []).length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery('');
    setIsOpen(false);
  };

  const showLoading = isLoading || isSearching;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Indian stocks (e.g., TCS, RELIANCE, ZOMATO)..."
          className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all duration-300"
          disabled={isLoading}
        />
        {showLoading && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
        >
          {suggestions.map((stock, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleSelect(stock.symbol)}
              className="w-full px-6 py-3 text-left hover:bg-accent-500/10 transition-colors flex items-center justify-between group"
              whileHover={{ x: 4 }}
            >
              <div>
                <div className="font-medium text-white">{stock.name}</div>
                <div className="text-sm text-white/50">{stock.symbol}</div>
              </div>
              <div className="text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
