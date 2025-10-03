import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
export const hasStripe = () => Boolean(key);

const API_VERSION = '2025-08-27.basil' as const;

export const stripe = key
  ? new Stripe(key, { apiVersion: API_VERSION })
  : (null as unknown as Stripe);
