import { FilterChoices } from './FilterChoices';

export enum Filter {
  CHOICES = 'choices',
  SELECT = 'select',
  SEARCH = 'search',
  DATE = 'date',
  NUMBER = 'number',
}

export const FilterMap = {
  [Filter.CHOICES]: FilterChoices,
};
