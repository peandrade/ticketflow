'use server';

import { z } from 'zod';

export type ActionState = {
  error?: string;
  ok?: boolean;
};

const ItemSchema = z.object({
  variantId: z.string().cuid(),
  qty: z.number().int().min(0).max(6),
});

const PayloadSchema = z.object({
  performanceId: z.string().cuid(),
  items: z.array(ItemSchema),
});

export async function saveOrderAction(
  _prevState: ActionState,           
  formData: FormData            
): Promise<ActionState> {       
  try {
    const parsed = PayloadSchema.safeParse({
      performanceId: formData.get('performanceId'),
      items: JSON.parse(String(formData.get('items') ?? '[]')),
    });
    if (!parsed.success) return { error: 'Dados inválidos.' };

    const { performanceId, items } = parsed.data;
    return { ok: true };
  } catch (e) {
    return { error: 'Falha ao processar sua solicitação.' };
  }
}
