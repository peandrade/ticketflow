import type { OrderStatus } from '@/generated/prisma';

type OrderItemDTO = {
  ticketTypeId: string;
  quantity: number;
};
type PerformanceDTO = {
  startsAt: string | Date;
};
export type RefundCheckInput = {
  status: OrderStatus;
  items: OrderItemDTO[];
  performance: PerformanceDTO | null;
  now?: Date;
};

export type RefundDecision =
  | { ok: true; restock: Array<{ ticketTypeId: string; quantity: number }> }
  | { ok: false; reason: string };

export function refundOrderRules(input: RefundCheckInput): RefundDecision {
  const now = input.now ?? new Date();

  if (input.status !== 'PAID') {
    return { ok: false, reason: 'Pedido não está pago.' };
  }
  const startsAt = input.performance ? new Date(input.performance.startsAt) : null;
  if (startsAt && startsAt <= now) {
    return { ok: false, reason: 'O evento já ocorreu ou está em andamento.' };
  }
  const restock = input.items.map(i => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }));
  return { ok: true, restock };
}
