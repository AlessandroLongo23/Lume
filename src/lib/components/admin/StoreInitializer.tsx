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
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
