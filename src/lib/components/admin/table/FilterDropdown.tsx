'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Funnel } from 'lucide-react';
import { Filter } from '@/lib/types/filters/Filter';
import { ChoicesFilter } from './filters/ChoicesFilter';
import { SelectFilter } from './filters/SelectFilter';
import { SearchFilter } from './filters/SearchFilter';
import { DateFilter } from './filters/DateFilter';
import { NumberFilter } from './filters/NumberFilter';
import type { FilterChoice } from '@/lib/types/dataColumn';

const PORTAL_OFFSET = 8;
const HORIZONTAL_PADDING = 16;
const MIN_WIDTH = 224;

interface DropdownPosition {
  top: number;
  left: number;
  minWidth: number;
  origin: 'top' | 'bottom';
}

interface FilterDropdownProps {
  type: Filter;
  options?: FilterChoice[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (v: any) => void;
  active?: boolean;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function FilterDropdown({
  type,
  options = [],
  value,
  onChange,
  active = false,
  open,
  onOpenChange,
}: FilterDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0, minWidth: MIN_WIDTH, origin: 'top' });
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const updatePosition = () => {
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = buttonRect.bottom + PORTAL_OFFSET + window.scrollY;
    let origin: 'top' | 'bottom' = 'top';

    const fitsAbove = buttonRect.top - PORTAL_OFFSET - dropdownRect.height > 0;
    const overflowsBelow = buttonRect.bottom + PORTAL_OFFSET + dropdownRect.height > viewportHeight;

    if (overflowsBelow && fitsAbove) {
      top = buttonRect.top - dropdownRect.height - PORTAL_OFFSET + window.scrollY;
      origin = 'bottom';
    }

    let left = buttonRect.left + window.scrollX;
    if (left + dropdownRect.width > viewportWidth - HORIZONTAL_PADDING) {
      left = Math.max(HORIZONTAL_PADDING, viewportWidth - dropdownRect.width - HORIZONTAL_PADDING);
    }

    setPosition({
      top,
      left,
      minWidth: Math.max(buttonRect.width, MIN_WIDTH),
      origin,
    });
  };

  useEffect(() => {
    if (!open) return;

    // Position after render
    const raf = requestAnimationFrame(updatePosition);

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('resize', handleResize);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      className="bg-white dark:bg-zinc-900 shadow-md rounded-md p-3 border border-zinc-200 dark:border-zinc-800 z-popover"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        minWidth: position.minWidth,
        transformOrigin: `${position.origin} left`,
      }}
      role="dialog"
      tabIndex={0}
      aria-label="Filtro"
    >
      {type === Filter.CHOICES && <ChoicesFilter options={options} value={value ?? []} onChange={onChange} />}
      {type === Filter.SELECT && <SelectFilter options={options} value={value ?? null} onChange={onChange} />}
      {type === Filter.SEARCH && <SearchFilter value={value ?? ''} onChange={onChange} />}
      {type === Filter.DATE && <DateFilter value={value ?? { from: '', to: '' }} onChange={onChange} />}
      {type === Filter.NUMBER && <NumberFilter value={value} onChange={onChange} />}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="relative"
        aria-label="Filtra"
        onClick={(e) => { e.stopPropagation(); onOpenChange(!open); }}
      >
        <Funnel className={`size-4 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        {active && (
          <span className="absolute -top-0.5 -right-0.5 bg-blue-600 dark:bg-blue-400 rounded-full w-1.5 h-1.5" />
        )}
      </button>
      {dropdown}
    </div>
  );
}
