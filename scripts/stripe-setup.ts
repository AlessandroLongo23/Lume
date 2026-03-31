/**
 * One-time script to create the Lume product and prices in Stripe.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *
 * After running, copy the printed price IDs into your .env.local file.
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Error: Set STRIPE_SECRET_KEY environment variable');
  process.exit(1);
}

const stripe = new Stripe(key, { typescript: true });

async function main() {
  // 1. Create product
  const product = await stripe.products.create({
    name: 'Lume - Gestionale Salone',
    description: 'Software gestionale per saloni di parrucchieri e barbieri in Italia.',
  });
  console.log(`Product created: ${product.id}`);

  // 2. Create monthly price (€49.90/month)
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 4990,
    currency: 'eur',
    recurring: { interval: 'month' },
    lookup_key: 'lume_monthly',
  });
  console.log(`Monthly price created: ${monthlyPrice.id}`);

  // 3. Create yearly price (€499.00/year)
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 49900,
    currency: 'eur',
    recurring: { interval: 'year' },
    lookup_key: 'lume_yearly',
  });
  console.log(`Yearly price created: ${yearlyPrice.id}`);

  console.log('\n--- Add these to your .env.local ---');
  console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
  console.log(`STRIPE_YEARLY_PRICE_ID=${yearlyPrice.id}`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
