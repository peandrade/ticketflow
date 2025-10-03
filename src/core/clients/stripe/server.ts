import Stripe from 'stripe';
import { env } from '@/core/env';

type ApiVersion = NonNullable<Stripe.StripeConfig['apiVersion']>;
const API_VERSION: ApiVersion = '2025-08-27.basil';

export const stripe: Stripe | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION })
  : null;

export const hasStripe = (): boolean => stripe !== null;
