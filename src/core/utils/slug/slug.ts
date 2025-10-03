export function slugifyCity(city: string) {
  return city
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function cityToSlug(city: string, state: string) {
  return `${slugifyCity(city)}-${state.toLowerCase()}`;
}

export function parseCitySlug(slug: string) {
  const i = slug.lastIndexOf('-');
  if (i === -1) return null;
  return { citySlug: slug.slice(0, i), state: slug.slice(i + 1).toUpperCase() };
}

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function venueToSlug(name: string, city: string, state: string) {
  return `${slugify(name)}--${slugify(city)}-${state.toLowerCase()}`
}

export function parseVenueSlug(slug: string) {
  const [left, state] = [slug.slice(0, slug.lastIndexOf('-')), slug.slice(slug.lastIndexOf('-')+1).toUpperCase()];
  const [venueSlug, citySlug] = left.split('--');
  if (!venueSlug || !citySlug || state.length !== 2) return null
  return { venueSlug, citySlug, state }
}

export function toSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\/_]+/g, " ")
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
