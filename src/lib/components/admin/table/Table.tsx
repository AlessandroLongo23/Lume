'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, ChevronUp, ChevronDown, MousePointerClick, Info, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { cardStyle } from '@/lib/const/appearance';
import { Filter } from '@/lib/types/filters/Filter';
import { NumberMode } from '@/lib/types/filters/NumberMode';
import { FilterDropdown } from './FilterDropdown';
import { Pagination } from './Pagination';
import type { DataColumn } from '@/lib/types/dataColumn';

interface TableProps {
  columns: DataColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  detailPageUrl?: string;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleEditClick?: (e: React.MouseEvent, item: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDeleteClick?: (e: React.MouseEvent, item: any) => void;
  labelPlural: string;
  labelSingular: string;
  elementsPerPage?: number;
  showNumbers?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraActions?: (item: any) => React.ReactNode;
}

export function Table({
  columns,
  data,
  detailPageUrl,
  isLoading,
  handleEditClick,
  handleDeleteClick,
  labelPlural,
  labelSingular,
  elementsPerPage = 25,
  showNumbers = false,
  extraActions,
}: TableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);

  // Animation counter — restarts on page change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCounter(0);
    const maxCount = (elementsPerPage + 1) * (columns.length + 1);
    const id = setInterval(() => {
      setCounter((c) => {
        if (c >= maxCount) { clearInterval(id); return c; }
        return c + 1;
      });
    }, 10);
    return () => clearInterval(id);
  }, [page, elementsPerPage, columns.length]);

  const isFilterActive = useCallback((key: string) => {
    const col = columns.find((c) => c.key === key);
    const v = filters[key];
    if (!col?.filter) return false;
    switch (col.filter) {
      case Filter.CHOICES: return Array.isArray(v) && v.length > 0;
      case Filter.SELECT: return v !== null && v !== undefined && v !== '';
      case Filter.SEARCH: return typeof v === 'string' && v.trim() !== '';
      case Filter.DATE: return v && (v.from || v.to);
      case Filter.NUMBER:
        if (!v) return false;
        if (v.mode === NumberMode.BETWEEN) return v.min != null || v.max != null;
        return v.value != null;
      default: return false;
    }
  }, [columns, filters]);

  // Compute unique options for CHOICES/SELECT columns
  const filterOptions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const optionsMap: Record<string, { value: any; label: string }[]> = {};
    for (const col of columns) {
      if (!col.filter) continue;
      if (col.filter === Filter.CHOICES || col.filter === Filter.SELECT) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, { value: any; label: string }>();
        for (const row of data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let choice: { value: any; label: string };
          if (col.getFilterChoice) {
            choice = col.getFilterChoice(row);
          } else {
            const raw = row[col.key];
            choice = { value: raw, label: String(raw ?? 'N/A') };
          }
          const k = String(choice?.value ?? '');
          if (!seen.has(k) && k !== '') seen.set(k, choice);
        }
        optionsMap[col.key] = Array.from(seen.values());
      }
    }
    return optionsMap;
  }, [columns, data]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter((row) => {
      for (const col of columns) {
        if (!col.filter || !isFilterActive(col.key)) continue;
        const v = filters[col.key];

        if (col.filter === Filter.CHOICES) {
          const selected = v || [];
          const value = col.getFilterChoice ? col.getFilterChoice(row)?.value : row[col.key];
          if (!selected.map(String).includes(String(value))) return false;
        }

        if (col.filter === Filter.SELECT) {
          const value = col.getFilterChoice ? col.getFilterChoice(row)?.value : row[col.key];
          if (String(value) !== String(v)) return false;
        }

        if (col.filter === Filter.SEARCH) {
          const term = String(v).toLowerCase();
          const text = col.display
            ? String(col.display(row)).toLowerCase()
            : String(row[col.key] ?? '').toLowerCase();
          if (!text.includes(term)) return false;
        }

        if (col.filter === Filter.DATE) {
          const from = v?.from ? new Date(v.from) : null;
          const to = v?.to ? new Date(v.to) : null;
          const cell = row[col.key];
          const d = cell instanceof Date ? cell : cell ? new Date(cell) : null;
          if (!d) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
        }

        if (col.filter === Filter.NUMBER) {
          const val = Number(row[col.key]);
          if (Number.isNaN(val)) return false;
          if (v.mode === NumberMode.EXACT && v.value != null && val !== Number(v.value)) return false;
          if (v.mode === NumberMode.LESS_THAN && v.value != null && !(val < Number(v.value))) return false;
          if (v.mode === NumberMode.LESS_THAN_OR_EQUAL && v.value != null && !(val <= Number(v.value))) return false;
          if (v.mode === NumberMode.GREATER_THAN && v.value != null && !(val > Number(v.value))) return false;
          if (v.mode === NumberMode.GREATER_THAN_OR_EQUAL && v.value != null && !(val >= Number(v.value))) return false;
          if (v.mode === NumberMode.BETWEEN) {
            if (v.min != null && !(val >= Number(v.min))) return false;
            if (v.max != null && !(val <= Number(v.max))) return false;
          }
        }
      }
      return true;
    });
  }, [data, columns, filters, isFilterActive]);

  const sortedData = useMemo(() => {
    if (filteredData.length === 0 || !sortColumn) return filteredData;
    const col = columns.find((c) => c.key === sortColumn);
    return [...filteredData].sort((a, b) => {
      if (col?.sort) return col.sort(a, b, sortDirection);
      const aValue = a[sortColumn] ?? '';
      const bValue = b[sortColumn] ?? '';
      if (sortDirection === 'asc') return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * elementsPerPage;
    return sortedData.slice(start, start + elementsPerPage);
  }, [sortedData, page, elementsPerPage]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setPage(1);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setFilter = (key: string, value: any) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleFilterDropdownToggle = (columnKey: string, isOpen: boolean) => {
    setOpenFilterDropdown(isOpen ? columnKey : (prev) => (prev === columnKey ? null : prev));
  };

  return (
    <div className="flex flex-col gap-4 items-start justify-between w-full">
      <div className={`shadow-sm max-h-130 w-full overflow-y-auto overflow-visible ${cardStyle}`}>
        <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
          <thead className="sticky top-0 z-sticky text-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400">
            <tr>
              {showNumbers && (
                <th scope="col" className="px-4 py-3 border-r border-zinc-500/25 w-10">
                  <Hash className="size-4 mx-auto" />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 py-3 border-r border-zinc-500/25 ${column?.width ?? ''}`}>
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`${column.sortable ? 'cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200' : ''} flex items-center gap-2 transition-colors`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      {column.icon && <column.icon className="size-4" />}
                      <span className="text-xs">{column.label.toUpperCase()}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp className={`size-3 ${sortColumn === column.key && sortDirection === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                          <ChevronDown className={`size-3 -mt-1 ${sortColumn === column.key && sortDirection === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                        </div>
                      )}
                    </div>
                    {column.filter && (
                      <FilterDropdown
                        type={column.filter}
                        options={filterOptions[column.key]}
                        value={filters[column.key]}
                        onChange={(v) => setFilter(column.key, v)}
                        active={isFilterActive(column.key)}
                        open={openFilterDropdown === column.key}
                        onOpenChange={(isOpen) => handleFilterDropdownToggle(column.key, isOpen)}
                      />
                    )}
                  </div>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 border-r border-zinc-500/25 pointer-events-none w-24">
                <div className="flex flex-row items-center gap-2">
                  <MousePointerClick className="size-4" />
                  <span className="text-xs">AZIONI</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  Caricando {labelPlural}...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr className="bg-white dark:bg-zinc-900 font-thin border-t border-zinc-500/25 dark:border-zinc-800">
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400 pointer-events-none">
                  Nessun {labelSingular} trovato. Aggiungi il tuo primo {labelSingular} per iniziare.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, i) => (
                <tr key={item.id} className="bg-white dark:bg-zinc-900 border-t border-zinc-500/25 dark:border-zinc-800">
                  {showNumbers && (
                    <td className="px-3 py-2 border-r border-zinc-200/50 dark:border-zinc-700/50 text-center">
                      {(page - 1) * elementsPerPage + i + 1}
                    </td>
                  )}
                  {columns.map((column, j) => (
                    <td
                      key={column.key}
                      onClick={() => column.onclick && column.onclick(item)}
                      className={[
                        'px-3 py-2 border-r border-zinc-200/50 dark:border-zinc-700/50',
                        column.onclick ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : 'pointer-events-none',
                        counter > i * (columns.length + 1) + j ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                        'transition-all duration-200 ease-in-out',
                      ].join(' ')}
                    >
                      {column.component
                        ? <column.component.is {...column.component.getProps(item)} />
                        : column.display
                          ? <span dangerouslySetInnerHTML={{ __html: column.display(item) }} />
                          : null}
                    </td>
                  ))}
                  <td
                    className={[
                      'flex items-center px-3 py-2 text-center justify-center gap-2',
                      counter > (i + 1) * (columns.length + 1) - 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                      'transition-all duration-200 ease-in-out',
                    ].join(' ')}
                  >
                    {detailPageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Dettaglio"
                        onClick={() => router.push(`/admin/${detailPageUrl}/${item.id}`)}
                        className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700 hover:text-blue-900 dark:text-blue-500"
                      >
                        <Info />
                      </Button>
                    )}
                    {handleEditClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Modifica"
                        onClick={(e) => handleEditClick(e, item)}
                        className="text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:text-zinc-500"
                      >
                        <Pencil />
                      </Button>
                    )}
                    {extraActions?.(item)}
                    {handleDeleteClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Elimina"
                        onClick={(e) => handleDeleteClick(e, item)}
                        className="text-red-600 hover:bg-red-100 dark:hover:bg-red-700 hover:text-red-900 dark:text-red-500"
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        onPageChange={setPage}
        totalItems={sortedData.length}
        itemsPerPage={elementsPerPage}
        labelPlural={labelPlural}
      />
    </div>
  );
}
