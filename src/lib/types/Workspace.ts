export type WorkspaceContext = {
  type:     'business' | 'client';
  salonId:  string;
  salonName: string;
  role:     'owner' | 'operator' | 'client';
};

export type GatewayResult = {
  businessContexts: WorkspaceContext[];
  clientContexts:   WorkspaceContext[];
  /** Pre-computed redirect target */
  redirect:        '/admin/calendario' | '/select-salon' | '/client-dashboard' | '/select-workspace' | '/platform';
  /** Non-null only when redirect === '/admin/calendario' (single unambiguous salon) */
  activeSalonId:   string | null;
  /** True when the authenticated user is a platform super-admin */
  isSuperAdmin?:   boolean;
};
