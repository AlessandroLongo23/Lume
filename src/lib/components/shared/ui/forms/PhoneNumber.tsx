'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { prefixes } from '@/lib/const/prefixes';

interface PhoneNumberProps {
  prefixCode: string;
  phoneNumber: string;
  onPrefixChange: (code: string) => void;
  onPhoneChange: (number: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PhoneNumber({
  prefixCode,
  phoneNumber,
  onPrefixChange,
  onPhoneChange,
  className = '',
  disabled = false,
}: PhoneNumberProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedPrefix = prefixes.find((p) => p.code === prefixCode) ?? prefixes[0];

  const filteredPrefixes = prefixes
    .filter((p) => p.country.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.country.localeCompare(b.country));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const buttons = optionsRef.current.querySelectorAll<HTMLButtonElement>('button');
      buttons[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const formatNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const matches = cleaned.match(selectedPrefix.format);
    if (!matches) return cleaned;
    return matches.slice(1).filter(Boolean).join(' ');
  };

  const handleSelect = (code: string) => {
    onPrefixChange(code);
    setShowDropdown(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const openDropdown = () => {
    if (disabled) return;
    setShowDropdown(true);
    setSearchQuery('');
    setHighlightedIndex(-1);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredPrefixes.length - 1));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredPrefixes.length) {
          handleSelect(filteredPrefixes[highlightedIndex].code);
        }
        break;
      }
      case 'Escape': {
        setShowDropdown(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      }
      case 'Tab': {
        setShowDropdown(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      }
    }
  };

  return (
    <div className={`flex flex-row gap-2 ${className}`}>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          aria-label="Seleziona prefisso telefonico"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          disabled={disabled}
          className={`h-full px-3 flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-500/25 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={openDropdown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
              e.preventDefault();
              openDropdown();
            }
          }}
        >
          <span className="text-zinc-900 dark:text-zinc-100">{selectedPrefix.code}</span>
          <ChevronDown className={`size-4 text-zinc-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute max-h-72 overflow-hidden top-full left-0 mt-1 w-60 bg-white dark:bg-zinc-900 border border-zinc-500/25 rounded-lg shadow-lg z-50">
            <div className="p-2 border-b border-zinc-500/25">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                placeholder="Cerca paese..."
                className="w-full px-2 py-1 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-500/25 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-shadow"
                onKeyDown={handleKeyNavigation}
              />
            </div>
            <div ref={optionsRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filteredPrefixes.map((p, i) => {
                const isHighlighted = highlightedIndex === i;
                const isSelected = p.code === prefixCode;
                return (
                  <button
                    key={p.code + p.country}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full px-3 py-2 text-left transition-colors
                      ${isSelected
                        ? 'bg-primary/10 text-primary-hover dark:text-primary/70'
                        : isHighlighted
                          ? 'bg-zinc-100 dark:bg-zinc-800'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    onClick={() => handleSelect(p.code)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                  >
                    <span className={isSelected ? '' : 'text-zinc-900 dark:text-zinc-100'}>{p.code}</span>
                    <span className={`text-sm ml-2 ${isSelected ? 'text-primary/70' : 'text-zinc-500'}`}>{p.country}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={selectedPrefix.placeholder || '000 000 0000'}
        disabled={disabled}
        className={`flex flex-1 min-w-0 p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        value={phoneNumber}
        onChange={(e) => onPhoneChange(formatNumber(e.target.value))}
      />
    </div>
  );
}
