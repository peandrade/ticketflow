export function urlCdn(publicId: string, opts?: { ar?: string; w?: number; c?: 'fill' | 'crop' | 'fit'; g?: 'auto' | 'face' }) {
  const ar = opts?.ar ?? '3:1';
  const w  = opts?.w ?? 800;
  const c  = opts?.c ?? 'fill';
  const g  = opts?.g ?? 'auto';
  return `https://res.cloudinary.com/${process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME']}/image/upload/ar_${ar},c_${c},g_${g},f_auto,q_auto,w_${w}/${publicId}`;
}
