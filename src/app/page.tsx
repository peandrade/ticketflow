import {
  EventList,
  HeroCarousel,
  FamilyHomeSection,
  VenuesHomeSection,
} from '@/features/components';
import CityShelf from './(home)/CityShelf';
import { getCityEvents, getEventsForHome } from '@/features/data';

export const revalidate = 60;

export default async function Home() {
  const events = await getEventsForHome(10);
  const cities = [
    { city: 'São Paulo', state: 'SP' },
    { city: 'Rio de Janeiro', state: 'RJ' },
    { city: 'Curitiba', state: 'PR' },
    { city: 'Brasília', state: 'DF' },
  ];

  const sections = await Promise.all(
    cities.map(async (c) => ({
      key: `${c.city}-${c.state}`,
      meta: c,
      items: await getCityEvents({ ...c, take: 3 }),
    })),
  );
  return (
    <main>
      <HeroCarousel event={events} />
      <FamilyHomeSection />
      <EventList />
      <div className="space-y-12 py-10">
        {sections.map((s) =>
          s.items.length ? (
            <CityShelf key={s.key} city={s.meta.city} state={s.meta.state} items={s.items} />
          ) : null,
        )}
      </div>
      <VenuesHomeSection />
    </main>
  );
}
