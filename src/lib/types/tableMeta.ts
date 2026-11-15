import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    pickerLabel?: string;
    lockedInPicker?: boolean;
    requiredVisible?: boolean;
    /** 'start' keeps the column first and out of the picker's reorder list. */
    pinned?: 'start';
  }
}

export {};
