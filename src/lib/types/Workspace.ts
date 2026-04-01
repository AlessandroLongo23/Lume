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
  redirect:        '/admin/calendario' | '/select-salon' | '/client-dashboard' | '/select-workspace';
  /** Non-null only when redirect === '/admin/calendario' (single unambiguous salon) */
  activeSalonId:   string | null;
};
