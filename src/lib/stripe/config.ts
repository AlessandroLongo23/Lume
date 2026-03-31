export const STRIPE_MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID!;
export const STRIPE_YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID!;

export const PLANS = {
  monthly: {
    name: 'Mensile',
    price: '49,90',
    priceRaw: 4990,
    interval: 'mese' as const,
    description: 'Fatturato mensilmente',
  },
  yearly: {
    name: 'Annuale',
    price: '499,00',
    priceRaw: 49900,
    interval: 'anno' as const,
    description: 'Risparmi ~100 € rispetto al piano mensile',
    badge: 'Risparmia ~100 €',
  },
} as const;
