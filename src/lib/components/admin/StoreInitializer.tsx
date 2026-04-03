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

  useEffect(() => {
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
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscriptions — re-fetch store when any row changes
  useRealtimeStore('clients', fetchClients);
  useRealtimeStore('operators', fetchOperators);
  useRealtimeStore('fiches', fetchFiches);
  useRealtimeStore('fiche_services', fetchFicheServices);
  useRealtimeStore('orders', fetchOrders);
  useRealtimeStore('products', fetchProducts);
  useRealtimeStore('product_categories', fetchProductCategories);
  useRealtimeStore('services', fetchServices);
  useRealtimeStore('service_categories', fetchServiceCategories);
  useRealtimeStore('client_categories', fetchClientCategories);
  useRealtimeStore('manufacturers', fetchManufacturers);
  useRealtimeStore('suppliers', fetchSuppliers);
  useRealtimeStore('reviews', fetchReviews);
  useRealtimeStore('coupons', fetchCoupons);
  useRealtimeStore('fiche_products', fetchFicheProducts);
  useRealtimeStore('fiche_payments', fetchFichePayments);

  return null;
}
