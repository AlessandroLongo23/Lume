'use client';

import { useCallback, useEffect } from 'react';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useOrdersStore } from '@/lib/stores/orders';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useReviewsStore } from '@/lib/stores/reviews';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';
import { useFichePaymentsStore } from '@/lib/stores/fiche_payments';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { useSpeseStore } from '@/lib/stores/spese';
import { useObiettiviStore } from '@/lib/stores/obiettivi';
import { useFeedbackStore } from '@/lib/stores/feedback';
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
  const fetchClientRatings = useClientRatingsStore((s) => s.fetchClientRatings);
  const fetchManufacturers = useManufacturersStore((s) => s.fetchManufacturers);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const fetchMyReview = useReviewsStore((s) => s.fetchMyReview);
  const fetchCoupons = useCouponsStore((s) => s.fetchCoupons);
  const fetchCouponRedemptions = useCouponsStore((s) => s.fetchRedemptions);
  const fetchAbbonamenti = useAbbonamentiStore((s) => s.fetchAbbonamenti);
  const fetchFicheProducts = useFicheProductsStore((s) => s.fetchFicheProducts);
  const fetchFichePayments = useFichePaymentsStore((s) => s.fetchFichePayments);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const fetchSpese = useSpeseStore((s) => s.fetchSpese);
  const fetchObiettivi = useObiettiviStore((s) => s.fetchObiettivi);
  const fetchFeedback = useFeedbackStore((s) => s.fetchEntries);
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
      fetchClientRatings(),
      fetchManufacturers(),
      fetchSuppliers(),
      fetchMyReview(),
      fetchCoupons(),
      fetchCouponRedemptions(),
      fetchAbbonamenti(),
      fetchFicheProducts(),
      fetchFichePayments(),
      fetchSubscription(),
      fetchSpese(),
      fetchObiettivi(),
      fetchFeedback(),
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ratings are a view over fiches/fiche_services/fiche_products — piggyback on their channels.
  const onFichesChange = useCallback(() => { fetchFiches(); fetchClientRatings(); }, [fetchFiches, fetchClientRatings]);
  const onFicheServicesChange = useCallback(() => { fetchFicheServices(); fetchClientRatings(); }, [fetchFicheServices, fetchClientRatings]);
  const onFicheProductsChange = useCallback(() => { fetchFicheProducts(); fetchClientRatings(); }, [fetchFicheProducts, fetchClientRatings]);

  // Realtime subscriptions — re-fetch store when any row changes (filtered to current salon)
  useRealtimeStore('clients', fetchClients, activeSalonId);
  useRealtimeStore('operators', fetchOperators, activeSalonId);
  useRealtimeStore('fiches', onFichesChange, activeSalonId);
  useRealtimeStore('fiche_services', onFicheServicesChange, activeSalonId);
  useRealtimeStore('fiche_products', onFicheProductsChange, activeSalonId);
  useRealtimeStore('orders', fetchOrders, activeSalonId);
  useRealtimeStore('products', fetchProducts, activeSalonId);
  useRealtimeStore('product_categories', fetchProductCategories, activeSalonId);
  useRealtimeStore('services', fetchServices, activeSalonId);
  useRealtimeStore('service_categories', fetchServiceCategories, activeSalonId);
  useRealtimeStore('manufacturers', fetchManufacturers, activeSalonId);
  useRealtimeStore('suppliers', fetchSuppliers, activeSalonId);
  // Reviews are platform-wide (one per user, not per-salon) — no salon_id filter.
  useRealtimeStore('reviews', fetchMyReview);
  useRealtimeStore('coupons', fetchCoupons, activeSalonId);
  useRealtimeStore('coupon_redemptions', fetchCouponRedemptions, activeSalonId);
  useRealtimeStore('abbonamenti', fetchAbbonamenti, activeSalonId);
  useRealtimeStore('fiche_payments', fetchFichePayments, activeSalonId);
  // Feedback is global — no salon_id filter.
  useRealtimeStore('feedback_entries', fetchFeedback);
  useRealtimeStore('feedback_upvotes', fetchFeedback);

  return null;
}
