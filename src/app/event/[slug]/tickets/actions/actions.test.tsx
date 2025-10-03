import { describe, it, expect } from 'vitest';
import { ActionState, saveOrderAction } from './actions';

function makeFD(performanceId?: string, items?: any): FormData {
  const fd = new FormData();
  if (performanceId !== undefined) fd.set('performanceId', performanceId);
  if (items !== undefined) fd.set('items', JSON.stringify(items));
  return fd;
}

// IDs com formato de CUID v1 (aceitos por zod().cuid())
const PERF_CUID = 'cjld2cjxh0000qzrmn831i7rn';
const VAR_CUID  = 'cjld2cjxh0001qzrmn831i7rn';

describe('saveOrderAction', () => {
  it('retorna erro quando performanceId ausente', async () => {
    const res = await saveOrderAction({} as ActionState, makeFD(undefined, []));
    expect(res).toEqual({ error: 'Dados inválidos.' });
  });

  it('retorna erro quando performanceId não é cuid', async () => {
    const res = await saveOrderAction({} as ActionState, makeFD('p1', []));
    expect(res).toEqual({ error: 'Dados inválidos.' });
  });

  it('retorna erro genérico quando items é JSON inválido', async () => {
    const fd = new FormData();
    fd.set('performanceId', PERF_CUID);
    fd.set('items', '{invalid json'); // força JSON.parse a lançar
    const res = await saveOrderAction({} as ActionState, fd);
    expect(res).toEqual({ error: 'Falha ao processar sua solicitação.' });
  });

  it('retorna erro quando variantId não é cuid', async () => {
    const items = [{ variantId: 'v1', qty: 1 }];
    const res = await saveOrderAction({} as ActionState, makeFD(PERF_CUID, items));
    expect(res).toEqual({ error: 'Dados inválidos.' });
  });

  it('retorna erro quando qty > 6', async () => {
    const items = [{ variantId: VAR_CUID, qty: 7 }];
    const res = await saveOrderAction({} as ActionState, makeFD(PERF_CUID, items));
    expect(res).toEqual({ error: 'Dados inválidos.' });
  });

  it('retorna ok=true quando payload é válido', async () => {
    const items = [
      { variantId: VAR_CUID, qty: 0 }, // limite inferior permitido
      { variantId: 'cjld2cjxh0002qzrmn831i7rn', qty: 6 }, // limite superior permitido
    ];
    const res = await saveOrderAction({} as ActionState, makeFD(PERF_CUID, items));
    expect(res).toEqual({ ok: true });
  });

  it('usa fallback [] quando "items" não é enviado', async () => {
    const fd = new FormData();
    fd.set('performanceId', PERF_CUID);
    
    const res = await saveOrderAction({} as ActionState, fd);
  
    expect(res).toEqual({ ok: true });
  });  
});
