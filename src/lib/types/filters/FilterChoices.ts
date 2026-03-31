import type { DataColumn } from '../dataColumn';

export class FilterChoices {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static rowPassesFilters(row: any, v: Array<string | number>, col: DataColumn) {
    const selected = v || [];
    let value: string | number;
    if (col.getFilterChoice) value = col.getFilterChoice(row)?.value;
    else value = row[col.key];

    if (!selected.map(String).includes(String(value))) return false;
    return true;
  }
}
