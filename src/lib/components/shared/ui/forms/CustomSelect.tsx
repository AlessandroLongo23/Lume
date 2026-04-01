'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

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
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const buttons = optionsRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]');
      buttons[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleOptionClick = (option: any) => {
    if (value === option[valueKey] && isNullable) {
      onChange(null);
    } else {
      onChange(option[valueKey]);
    }
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  const openDropdown = () => {
    if (!disabled) {
      setIsOpen(true);
      setHighlightedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        } else if (filteredOptions.length > 0) {
          handleOptionClick(filteredOptions[0]);
        }
        break;
      }
      case 'Escape': {
        closeDropdown();
        break;
      }
      case 'Tab': {
        closeDropdown();
        break;
      }
    }
  };

  return (
    <div ref={ref} className={`relative ${classes} ${width}`}>
      <div
        ref={triggerRef}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        className={`w-full px-3 py-2 text-left bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg
          transition-all flex items-center justify-between
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50'}`}
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
              aria-label="Rimuovi selezione"
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <X className="h-4 w-4 text-zinc-500" />
            </button>
          )}
          <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-100 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-zinc-500/25">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-500/25 rounded-md text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-shadow"
                placeholder="Cerca..."
                onKeyDown={handleKeyNavigation}
              />
            </div>
          )}
          <div ref={optionsRef} role="listbox" className={`${maxHeight} overflow-y-auto`}>
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">Nessun risultato</div>
            ) : (
              filteredOptions.map((option, i) => {
                const isSelected = value === option[valueKey];
                const isHighlighted = highlightedIndex === i;
                return (
                  <button
                    key={option[valueKey] ?? i}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full p-2 cursor-pointer transition-colors text-left flex items-center justify-between
                      ${isSelected
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : isHighlighted
                          ? 'bg-zinc-100 dark:bg-zinc-700'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                  >
                    <span>{getLabel(option)}</span>
                    {isSelected && <Check className="size-4 text-indigo-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
