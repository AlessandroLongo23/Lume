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
  calendar?: {
    defaultOperatorId?: string;
    weekStartsOn?: 0 | 1;
  };
  notifications?: {
    lowStock?: boolean;
    noShow?: boolean;
    newBooking?: boolean;
    dailyDigest?: boolean;
  };
}
