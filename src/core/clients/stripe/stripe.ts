import Stripe from 'stripe';

import { env } from '@/core/env';
const key = env.STRIPE_SECRET_KEY;

const API_VERSION = '2025-08-27.basil' as const;

export const stripe = key
  ? new Stripe(key, { apiVersion: API_VERSION })
  : (null as unknown as Stripe);

export const hasStripe = (): boolean => stripe !== null;