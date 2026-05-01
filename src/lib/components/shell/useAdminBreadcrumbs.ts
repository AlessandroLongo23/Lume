'use client';

import { useMemo } from 'react';
import { adminRoutes, adminSettingsRoute, type AdminRoute } from '@/lib/const/data';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useProductsStore } from '@/lib/stores/products';
import { useOrdersStore } from '@/lib/stores/orders';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useFeedbackStore } from '@/lib/stores/feedback';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useServicesStore } from '@/lib/stores/services';
import type { BreadcrumbItem } from './Breadcrumbs';

function findRoute(slug: string): { groupTitle: string; route: AdminRoute } | null {
  for (const group of adminRoutes) {
    const route = group.routes.find((r) => r.url === slug);
    if (route) return { groupTitle: group.title, route };
  }
  return null;
}

export function useAdminBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const clients = useClientsStore((s) => s.clients);
  const operators = useOperatorsStore((s) => s.operators);
  const products = useProductsStore((s) => s.products);
  const orders = useOrdersStore((s) => s.orders);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const feedbackEntries = useFeedbackStore((s) => s.entries);
  const serviceCategories = useServiceCategoriesStore((s) => s.service_categories);
  const services = useServicesStore((s) => s.services);

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] !== 'admin' || !segments[1]) return [];

    const slug = segments[1];

    if (slug === adminSettingsRoute.url) {
      return [{ label: adminSettingsRoute.name }];
    }

    const found = findRoute(slug);
    if (!found) return [];

    const routeHref = `/admin/${slug}`;

    if (segments.length === 2) {
      return [{ label: found.groupTitle }, { label: found.route.name }];
    }

    const items: BreadcrumbItem[] = [
      { label: found.groupTitle },
      { label: found.route.name, href: routeHref },
    ];

    if (slug === 'clienti' && segments[2]) {
      const client = clients.find((c) => c.id === segments[2]);
      const fullName = client ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() : '';
      items.push({ label: fullName || 'Cliente' });
      return items;
    }

    if (slug === 'operatori' && segments[2]) {
      const op = operators.find((o) => o.id === segments[2]);
      const fullName = op ? `${op.firstName ?? ''} ${op.lastName ?? ''}`.trim() : '';
      items.push({ label: fullName || 'Operatore' });
      return items;
    }

    if (slug === 'feedback' && segments[2]) {
      const entry = feedbackEntries.find((e) => e.id === segments[2]);
      items.push({ label: entry?.title || 'Feedback' });
      return items;
    }

    if (slug === 'ordini' && segments[2]) {
      const order = orders.find((o) => o.id === segments[2]);
      const supplier = order ? suppliers.find((s) => s.id === order.supplier_id) : undefined;
      items.push({ label: supplier?.name || 'Ordine' });
      return items;
    }

    if (slug === 'magazzino' && segments[2] === 'prodotti' && segments[3]) {
      const product = products.find((p) => p.id === segments[3]);
      items.push({ label: product?.name || 'Prodotto' });
      return items;
    }

    if (slug === 'servizi' && segments[2]) {
      const category = serviceCategories.find((c) => c.id === segments[2]);
      const categoryHref = `/admin/servizi/${segments[2]}`;
      if (segments[3]) {
        items.push({ label: category?.name || 'Categoria', href: categoryHref });
        const service = services.find((s) => s.id === segments[3]);
        items.push({ label: service?.name || 'Servizio' });
      } else {
        items.push({ label: category?.name || 'Categoria' });
      }
      return items;
    }

    return items;
  }, [pathname, clients, operators, products, orders, suppliers, feedbackEntries, serviceCategories, services]);
}
