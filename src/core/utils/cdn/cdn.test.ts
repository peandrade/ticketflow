import { describe, it, expect } from 'vitest';
import { urlCdn } from './cdn';

describe('lib/cdn#urlCdn', () => {
  it('gera URL com defaults quando sem opções', () => {
    const url = urlCdn('folder/img-id');
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(url).toContain('/image/upload/');
    expect(url).toContain('ar_3:1');
    expect(url).toContain('c_fill');
    expect(url).toContain('g_auto');
    expect(url).toContain('f_auto');
    expect(url).toContain('q_auto');
    expect(url).toContain('w_800');
    expect(url.endsWith('/folder/img-id')).toBe(true);
  });

  it('aceita overrides (crop, tamanho, gravity)', () => {
    const url = urlCdn('id', { ar: '1:1', w: 256, c: 'crop', g: 'face' });
    expect(url).toContain('ar_1:1');
    expect(url).toContain('w_256');
    expect(url).toContain('c_crop');
    expect(url).toContain('g_face');
  });
});
