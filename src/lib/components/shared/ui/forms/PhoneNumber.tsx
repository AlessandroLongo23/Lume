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
}

export function PhoneNumber({
  prefixCode,
  phoneNumber,
  onPrefixChange,
  onPhoneChange,
  className = '',
}: PhoneNumberProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPrefix = prefixes.find((p) => p.code === prefixCode) ?? prefixes[0];

  const filteredPrefixes = prefixes
    .filter((p) => p.country.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.country.localeCompare(b.country));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-row gap-2 ${className}`}>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          className="h-full px-3 flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-500/25 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          onClick={() => { setShowDropdown(!showDropdown); setSearchQuery(''); }}
        >
          <span className="text-zinc-900 dark:text-zinc-100">{selectedPrefix.code}</span>
          <ChevronDown className="size-4 text-zinc-500" />
        </button>

        {showDropdown && (
          <div className="absolute max-h-72 overflow-y-auto top-full left-0 mt-1 w-60 py-1 bg-white dark:bg-zinc-900 border border-zinc-500/25 rounded-lg shadow z-50">
            <div className="p-2 border-b border-zinc-500/25">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca paese..."
                className="w-full px-2 py-1 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-500/25 rounded focus:outline-none"
                autoFocus
              />
            </div>
            {filteredPrefixes.map((p) => (
              <button
                key={p.code + p.country}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => handleSelect(p.code)}
              >
                <span className="text-zinc-900 dark:text-zinc-100">{p.code}</span>
                <span className="text-sm text-zinc-500 ml-2">{p.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={selectedPrefix.placeholder || '000 000 0000'}
        className="flex p-2.5 max-w-[12rem] rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-500/25 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 transition-colors"
        value={phoneNumber}
        onChange={(e) => onPhoneChange(formatNumber(e.target.value))}
      />
    </div>
  );
}
