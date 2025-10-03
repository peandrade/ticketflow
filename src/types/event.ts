export type Event = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  heroPublicId: string | null;
  performances: Array<{
    startsAt: Date;
    venue: { city: string; state: string };
  }>;
};

export type EventItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  heroPublicId: string;
  performances: Array<{
    startsAt: Date;
    venueName: string;
    venueCity: string;
    venueState: string;
    ticketTypes: {
      name: string;
      priceCents: number;
      initialQuantity: number;
    };
  }>;
};

export type EventDetail = {
  id: string
  title: string
  shortDescription: string
  heroPublicId: string | null
  performances: Array<{
    id: string;
    startsAt: Date;
    venue: { name: string; city: string; state: string };
    ticketTypes: Array<{
      id: string;
      name: string;
      priceCents: number;
      initialQuantity: number;
      inventory?: { available: number } | null;
    }>;
  }>;
}

export type PerformanceOption = {
  id: string
  startsAt: Date
  venue: { name: string; city: string; state: string }
  availableTotal?: number
  minPriceCents?: number
  maxPriceCents?: number
}
