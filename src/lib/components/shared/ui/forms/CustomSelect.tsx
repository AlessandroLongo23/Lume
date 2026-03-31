'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface CustomSelectProps {
  value: any;
  onChange: (value: any) => void;
  options: any[];
  labelKey: string | ((option: any) => string);
  valueKey: string;
  placeholder?: string;
  isNullable?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  maxHeight?: string;
  classes?: string;
  width?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  labelKey,
  valueKey,
  placeholder = "Seleziona un'opzione",
  isNullable = false,
  disabled = false,
  searchable = true,
  maxHeight = 'max-h-40',
  classes = '',
  width = 'w-full',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getLabel = useCallback((option: any): string => {
    if (typeof labelKey === 'function') return labelKey(option);
    return option[labelKey] ?? '';
  }, [labelKey]);

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o[valueKey] === value);
    return found ? getLabel(found) : placeholder;
  }, [value, options, valueKey, placeholder, getLabel]);

  const filteredOptions = useMemo(() => {
    if (searchable && searchQuery) {
      return options.filter((o) => getLabel(o).toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return options;
  }, [options, searchQuery, searchable, getLabel]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOptionClick = (option: any) => {
    if (value === option[valueKey] && isNullable) {
      onChange(null);
    } else {
      onChange(option[valueKey]);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const openDropdown = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div ref={ref} className={`relative ${classes} ${width}`}>
      <div
        role="button"
        tabIndex={0}
        className={`w-full px-3 py-2 text-left bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-sm
          hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            openDropdown();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`block truncate ${selectedLabel === placeholder ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {selectedLabel}
        </span>
        <div className="flex items-center gap-2">
          {value !== null && value !== undefined && isNullable && (
            <button
              type="button"
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <X className="h-4 w-4 text-zinc-500" />
            </button>
          )}
          <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow z-50 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-zinc-500/25">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-500/25 rounded-md text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Cerca..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredOptions.length > 0) handleOptionClick(filteredOptions[0]);
                  if (e.key === 'Escape') { setIsOpen(false); setSearchQuery(''); }
                }}
              />
            </div>
          )}
          <div className={`${maxHeight} overflow-y-auto`}>
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">Nessun risultato</div>
            ) : (
              filteredOptions.map((option, i) => (
                <button
                  key={option[valueKey] ?? i}
                  type="button"
                  className={`w-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors text-left flex items-center justify-between
                    ${value === option[valueKey] ? 'bg-zinc-100 dark:bg-zinc-700' : ''}`}
                  onClick={() => handleOptionClick(option)}
                >
                  <span className="text-zinc-900 dark:text-zinc-100">{getLabel(option)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
