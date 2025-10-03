import { z } from 'zod';

const server = z.object({
  DATABASE_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional().nullable()
    .transform(v => v ?? null),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional().nullable()
    .transform(v => v ?? null),
});

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional().nullable()
    .transform(v => v ?? null),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
});

export const env = {
  ...server.parse({
    DATABASE_URL: process.env['DATABASE_URL'],
    STRIPE_SECRET_KEY: process.env['STRIPE_SECRET_KEY'],
    STRIPE_WEBHOOK_SECRET: process.env['STRIPE_WEBHOOK_SECRET'],
  }),
  ...client.parse({
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'],
  }),
};
