export type Theme = 'system' | 'light' | 'dark';
export type Density = 'compact' | 'comfortable';
export type SidebarDefault = 'open' | 'collapsed';

export type ClientiView = 'table' | 'grid';
export type FichesView = 'table' | 'grid';
export type OrdiniView = 'table' | 'calendar';
export type CalendarioView = 'day' | 'week' | 'month';

export type TabsPageKey = 'magazzino' | 'servizi' | 'coupons' | 'bilancio' | 'fiches';

export interface TabsPreference {
  order: string[];
  hidden: string[];
}

export interface TableColumnsPreference {
  order: string[];
  hidden: string[];
}

export interface BirthdayReminderPreference {
  enabled: boolean;
  daysAhead: number;
}

export interface ProfilePreferences {
  appearance?: {
    theme?: Theme;
    density?: Density;
    sidebarDefault?: SidebarDefault;
  };
  defaultViews?: {
    clienti?: ClientiView;
    fiches?: FichesView;
    ordini?: OrdiniView;
    calendario?: CalendarioView;
  };
  tabs?: Partial<Record<TabsPageKey, TabsPreference>>;
  tableColumns?: Partial<Record<string, TableColumnsPreference>>;
  calendar?: {
    defaultOperatorId?: string;
    weekStartsOn?: 0 | 1;
    operatorOrder?: string[];
  };
  notifications?: {
    lowStock?: boolean;
    noShow?: boolean;
    newBooking?: boolean;
    dailyDigest?: boolean;
  };
  clientsTable?: {
    birthdayReminder?: BirthdayReminderPreference;
  };
  tutorials?: {
    /** ids of tutorials whose interactive guide the user has completed */
    completedIds?: string[];
    /** true once the user dismissed (or accepted) the first-run nudge */
    firstRunDismissed?: boolean;
    /** last interactive tour the user started — lets us resume/highlight it */
    lastTourId?: string;
  };
}
