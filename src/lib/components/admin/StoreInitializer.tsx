'use client';

import { useEffect } from 'react';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useOrdersStore } from '@/lib/stores/orders';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useClientCategoriesStore } from '@/lib/stores/client_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useReviewsStore } from '@/lib/stores/reviews';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';
import { useFichePaymentsStore } from '@/lib/stores/fiche_payments';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { useSpeseStore } from '@/lib/stores/spese';
import { useObiettiviStore } from '@/lib/stores/obiettivi';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';

export function StoreInitializer() {
  const fetchClients = useClientsStore((s) => s.fetchClients);
  const fetchOperators = useOperatorsStore((s) => s.fetchOperators);
  const fetchFiches = useFichesStore((s) => s.fetchFiches);
  const fetchFicheServices = useFicheServicesStore((s) => s.fetchFicheServices);
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const fetchProductCategories = useProductCategoriesStore((s) => s.fetchProductCategories);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const fetchServiceCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);
  const fetchClientCategories = useClientCategoriesStore((s) => s.fetchClientCategories);
  const fetchManufacturers = useManufacturersStore((s) => s.fetchManufacturers);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const fetchReviews = useReviewsStore((s) => s.fetchReviews);
  const fetchCoupons = useCouponsStore((s) => s.fetchCoupons);
  const fetchFicheProducts = useFicheProductsStore((s) => s.fetchFicheProducts);
  const fetchFichePayments = useFichePaymentsStore((s) => s.fetchFichePayments);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const fetchSpese = useSpeseStore((s) => s.fetchSpese);
  const fetchObiettivi = useObiettiviStore((s) => s.fetchObiettivi);
  const activeSalonId = useWorkspaceStore((s) => s.activeSalonId);
  const resolve = useWorkspaceStore((s) => s.resolve);

  useEffect(() => {
    resolve();
    Promise.all([
      fetchClients(),
      fetchOperators(),
      fetchFiches(),
      fetchFicheServices(),
      fetchOrders(),
      fetchProducts(),
      fetchProductCategories(),
      fetchServices(),
      fetchServiceCategories(),
      fetchClientCategories(),
      fetchManufacturers(),
      fetchSuppliers(),
      fetchReviews(),
      fetchCoupons(),
      fetchFicheProducts(),
      fetchFichePayments(),
      fetchSubscription(),
      fetchSpese(),
      fetchObiettivi(),
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscriptions — re-fetch store when any row changes (filtered to current salon)
  useRealtimeStore('clients', fetchClients, activeSalonId);
  useRealtimeStore('operators', fetchOperators, activeSalonId);
  useRealtimeStore('fiches', fetchFiches, activeSalonId);
  useRealtimeStore('fiche_services', fetchFicheServices, activeSalonId);
  useRealtimeStore('orders', fetchOrders, activeSalonId);
  useRealtimeStore('products', fetchProducts, activeSalonId);
  useRealtimeStore('product_categories', fetchProductCategories, activeSalonId);
  useRealtimeStore('services', fetchServices, activeSalonId);
  useRealtimeStore('service_categories', fetchServiceCategories, activeSalonId);
  useRealtimeStore('client_categories', fetchClientCategories, activeSalonId);
  useRealtimeStore('manufacturers', fetchManufacturers, activeSalonId);
  useRealtimeStore('suppliers', fetchSuppliers, activeSalonId);
  useRealtimeStore('reviews', fetchReviews, activeSalonId);
  useRealtimeStore('coupons', fetchCoupons, activeSalonId);
  useRealtimeStore('fiche_products', fetchFicheProducts, activeSalonId);
  useRealtimeStore('fiche_payments', fetchFichePayments, activeSalonId);

  return null;
}
