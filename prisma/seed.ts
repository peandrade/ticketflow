import { toSlug } from "@/core/utils";
import { PrismaClient } from "@/generated/prisma";

const toNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const opt = <K extends string, V>(k: K, v: V | undefined) => (v === undefined ? {} as Record<K, never> : { [k]: v } as Record<K, V>);

const daysFromNow = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt;
};

const at = (d: Date, h = 21, m = 0) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.performance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();
}

type VenueSeed = {
  name: string;
  city: string;
  state: string;
  address?: string;
  capacity?: number;
  coverPublicId?: string;
  slug?: string;
};

type EventSeed = {
  title: string;
  slug: string;
  shortDescription: string;
  heroPublicId?: string;
  performances: Array<{
    startsAt: Date;
    endsAt?: Date;
    venueName: string;
    venueCity: string;
    venueState: string;
    ticketTypes: Array<{
      name: string;
      priceCents: number;
      initialQuantity: number;
    }>;
  }>;
};

const venues: VenueSeed[] = [
  {
    name: 'Estádio do Morumbis',
    city: 'São Paulo',
    state: 'SP',
    address: 'Praça Roberto Gomes Pedrosa, 1 - Morumbi, São Paulo - SP, 05653-070',
    capacity: 92000,
    coverPublicId: 'estadio-morumbis',
    slug: 'estadio-morumbis',
  },

  {
    name: 'Estádio Nilton Santos',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'R. José dos Reis, 425 - Engenho de Dentro, Rio de Janeiro - RJ, 20770-001',
    capacity: 92000,
    coverPublicId: 'estadio-nilton-santos',
    slug: 'estadio-nilton-santos',
  },

  {
    name: 'Arena Corinthians',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Miguel Ignácio Curi, 111 - Vila Carmosina, São Paulo - SP, 08295-005',
    capacity: 62000,
    coverPublicId: 'arena-corinthians',
    slug: 'arena-corinthians',
  },

  {
    name: 'Estádio Couto Pereira',
    city: 'Curitiba',
    state: 'PR',
    address: 'R. Ubaldino do Amaral, 63 - Alto da Glória, Curitiba - PR, 80060-195',
    capacity: 58000,
    coverPublicId: 'estadio-couto-pereira',
    slug: 'estadio-couto-pereira',
  },

  {
    name: 'Arena BRB Mané Garrincha',
    city: 'Brasília',
    state: 'DF',
    address: 'Eixo Monumental - SRPN - Asa Norte, Brasília - DF, 70070-701',
    capacity: 82000,
    coverPublicId: 'arena-brb',
    slug: 'arena-brb',
  },

  {
    name: 'Espaço Unimed',
    city: 'São Paulo',
    state: 'SP',
    address: 'R. Tagipuru, 795 - Barra Funda, São Paulo - SP, 01156-000',
    capacity: 8000,
    coverPublicId: 'espaco-unimed',
    slug: 'espaco-unimed',
  },

  {
    name: 'Qualistage',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Av. Ayrton Senna, 3000 - Barra da Tijuca, Rio de Janeiro - RJ, 22775-003',
    capacity: 9000,
    coverPublicId: 'qualistage',
    slug: 'qualistage',
  },

  {
    name: 'Vibra São Paulo',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. das Nações Unidas, 17955 - Vila Almeida, São Paulo - SP, 04795-100',
    capacity: 7000,
    coverPublicId: 'vibra-sp',
    slug: 'vibra-sp',
  },

  {
    name: 'Classic Hall',
    city: 'Olinda Recife',
    state: 'PE',
    address: 'Av. Gov. Agamenon Magalhães, s/n - Salgadinho, Olinda - PE, 53110-000',
    capacity: 12000,
    coverPublicId: 'classic-hall',
    slug: 'classic-hall',
  },

  {
    name: 'Auditório Araújo Vianna',
    city: 'Porto Alegre',
    state: 'RS',
    address: 'Av. Osvaldo Aranha, 685 - Bom Fim, Porto Alegre - RS, 90035-191',
    capacity: 3000,
    coverPublicId: 'araujo-vianna',
    slug: 'araujo-vianna',
  },

  {
    name: 'Teatro Positivo',
    city: 'Curitiba',
    state: 'PR',
    address:
      'R. Prof. Pedro Viriato Parigot de Souza, 5300 - Campo Comprido, Curitiba - PR, 81280-330',
    capacity: 2500,
    coverPublicId: 'teatro-positivo',
    slug: 'teatro-positivo',
  },

  {
    name: 'Multiplan Hall Ribeirão',
    city: 'Ribeirão Preto',
    state: 'SP',
    address: 'Av. Cel. Fernando Ferreira Leite, 1540 - Ribeirão Preto - SP',
    capacity: 6000,
    coverPublicId: 'multiplan-hall-ribeirao',
    slug: 'multiplan-hall-ribeirao',
  },

  {
    name: 'Multiplan Hall São Caetano',
    city: 'São Caetano do Sul',
    state: 'SP',
    address: 'Alameda Terracota, 545 - São Caetano do Sul - SP',
    capacity: 6000,
    coverPublicId: 'multiplan-hall-saocaetano',
    slug: 'multiplan-hall-saocaetano',
  },

  {
    name: 'Sampa Sky',
    city: 'São Paulo',
    state: 'SP',
    address: 'Praça Ramos de Azevedo, 65 - República, São Paulo - SP',
    coverPublicId: 'sampasky',
    slug: 'sampasky',
  },

  {
    name: 'Roda Rico',
    city: 'São Paulo',
    state: 'SP',
    address: 'Parque Cândido Portinari - Vila Hamburguesa, São Paulo - SP',
    coverPublicId: 'roda-rico',
    slug: 'roda-rico',
  },

  {
    name: 'Zoo de São Paulo',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Miguel Stéfano, 4241 - Água Funda, São Paulo - SP',
    coverPublicId: 'zoo-sao-paulo',
    slug: 'zoo-sao-paulo',
  },

  {
    name: 'Júlio Verne Experience',
    city: 'São Paulo',
    state: 'SP',
    coverPublicId: 'julio-verne',
    slug: 'julio-verne',
  },

  {
    name: 'SP Gastronomia 2025',
    city: 'São Paulo',
    state: 'SP',
    coverPublicId: 'sp-gastronomia-2025',
    slug: 'sp-gastronomia-2025',
  },

  {
    name: 'Napoleo Experience São Paulo',
    city: 'São Paulo',
    state: 'SP',
    coverPublicId: 'napoleo-experience-sao-paulo',
    slug: 'napoleo-experience-sao-paulo',
  },

  {
    name: 'Centro de Convenções Hangar',
    city: 'Belém',
    state: 'PA',
    coverPublicId: 'hangar-convencoes-belem',
    slug: 'hangar-convencoes-belem',
  },
];

const events: EventSeed[] = [
  {
    title: 'Bruno Mars',
    slug: 'bruno-mars',
    shortDescription: 'Bruninho veio ao Brasil, venha conferir!',
    heroPublicId: 'bruno-mars',
    performances: [
      {
        startsAt: at(daysFromNow(5), 21, 0),
        venueName: 'Estádio do Morumbis',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 15000, priceCents: 89000 },
          { name: 'Pista', initialQuantity: 28000, priceCents: 59000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 74000 },
          { name: 'Cadeira Superior', initialQuantity: 14000, priceCents: 53000 },
          { name: 'Arquibancada', initialQuantity: 22000, priceCents: 42000 },
        ],
      },
      {
        startsAt: at(daysFromNow(12), 20, 30),
        venueName: 'Arena BRB Mané Garrincha',
        venueCity: 'Brasília',
        venueState: 'DF',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 12000, priceCents: 84000 },
          { name: 'Pista', initialQuantity: 20000, priceCents: 52000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 68000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 48000 },
          { name: 'Arquibancada', initialQuantity: 18000, priceCents: 39000 },
        ],
      },
      {
        startsAt: at(daysFromNow(19), 21, 30),
        venueName: 'Estádio Nilton Santos',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 10000, priceCents: 92000 },
          { name: 'Pista', initialQuantity: 16000, priceCents: 56000 },
          { name: 'Cadeira Inferior', initialQuantity: 11000, priceCents: 76000 },
          { name: 'Cadeira Superior', initialQuantity: 11000, priceCents: 49000 },
          { name: 'Arquibancada', initialQuantity: 16000, priceCents: 41000 },
        ],
      },
    ],
  },
  {
    title: 'Dua Lipa',
    slug: 'dua-lipa',
    shortDescription: 'Dua Lipa vem aí!',
    heroPublicId: 'dua-lipa',
    performances: [
      {
        startsAt: at(daysFromNow(7), 21, 0),
        venueName: 'Arena BRB Mané Garrincha',
        venueCity: 'Brasília',
        venueState: 'DF',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 10000, priceCents: 90000 },
          { name: 'Pista', initialQuantity: 15000, priceCents: 60000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 72000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 54000 },
          { name: 'Arquibancada', initialQuantity: 30000, priceCents: 43000 },
        ],
      },
      {
        startsAt: at(daysFromNow(16), 20, 30),
        venueName: 'Estádio Nilton Santos',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 9000, priceCents: 94000 },
          { name: 'Pista', initialQuantity: 15000, priceCents: 62000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 74000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 52000 },
          { name: 'Arquibancada', initialQuantity: 26000, priceCents: 45000 },
        ],
      },
      {
        startsAt: at(daysFromNow(23), 21, 0),
        venueName: 'Espaço Unimed',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista Premium', initialQuantity: 1800, priceCents: 78000 },
          { name: 'Pista', initialQuantity: 3000, priceCents: 52000 },
          { name: 'Mezanino', initialQuantity: 2000, priceCents: 47000 },
          { name: 'Camarote', initialQuantity: 600, priceCents: 110000 },
        ],
      },
    ],
  },
  {
    title: 'Post Malone',
    slug: 'post-malone',
    shortDescription: 'Post Malone com TRAP Internacional',
    heroPublicId: 'post-malone',
    performances: [
      {
        startsAt: at(daysFromNow(9), 21, 0),
        venueName: 'Estádio Nilton Santos',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 10000, priceCents: 95000 },
          { name: 'Pista', initialQuantity: 15000, priceCents: 60000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 78000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 52000 },
          { name: 'Arquibancada', initialQuantity: 33000, priceCents: 46000 },
        ],
      },
      {
        startsAt: at(daysFromNow(18), 20, 30),
        venueName: 'Estádio Couto Pereira',
        venueCity: 'Curitiba',
        venueState: 'PR',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 9000, priceCents: 88000 },
          { name: 'Pista', initialQuantity: 10000, priceCents: 52000 },
          { name: 'Cadeira Inferior', initialQuantity: 8000, priceCents: 44000 },
          { name: 'Cadeira Superior', initialQuantity: 8000, priceCents: 36000 },
          { name: 'Arquibancada', initialQuantity: 20000, priceCents: 34000 },
        ],
      },
      {
        startsAt: at(daysFromNow(26), 21, 30),
        venueName: 'Arena BRB Mané Garrincha',
        venueCity: 'Brasília',
        venueState: 'DF',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 10000, priceCents: 92000 },
          { name: 'Pista', initialQuantity: 16000, priceCents: 56000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 74000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 52000 },
          { name: 'Arquibancada', initialQuantity: 24000, priceCents: 42000 },
        ],
      },
    ],
  },
  {
    title: 'Travis Scott',
    slug: 'travis-scott',
    shortDescription: 'Travis Scott com os maiores hits',
    heroPublicId: 'travis-scott',
    performances: [
      {
        startsAt: at(daysFromNow(6), 20, 0),
        venueName: 'Estádio Couto Pereira',
        venueCity: 'Curitiba',
        venueState: 'PR',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 9000, priceCents: 93000 },
          { name: 'Pista', initialQuantity: 10000, priceCents: 60000 },
          { name: 'Cadeira Inferior', initialQuantity: 8000, priceCents: 45000 },
          { name: 'Cadeira Superior', initialQuantity: 8000, priceCents: 36000 },
          { name: 'Arquibancada', initialQuantity: 20000, priceCents: 35000 },
        ],
      },
      {
        startsAt: at(daysFromNow(15), 21, 30),
        venueName: 'Arena Corinthians',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 10000, priceCents: 98000 },
          { name: 'Pista', initialQuantity: 15000, priceCents: 80000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 83000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 55000 },
          { name: 'Arquibancada', initialQuantity: 33000, priceCents: 50000 },
        ],
      },
      {
        startsAt: at(daysFromNow(24), 21, 30),
        venueName: 'Espaço Unimed',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista Premium', initialQuantity: 2000, priceCents: 88000 },
          { name: 'Pista', initialQuantity: 3500, priceCents: 56000 },
          { name: 'Mezanino', initialQuantity: 1800, priceCents: 49000 },
          { name: 'Camarote', initialQuantity: 600, priceCents: 120000 },
        ],
      },
    ],
  },
  {
    title: 'Matuê',
    slug: 'matue',
    shortDescription: 'Matuê, o fenômeno brasileiro',
    heroPublicId: 'matue',
    performances: [
      {
        startsAt: at(daysFromNow(8), 20, 30),
        venueName: 'Arena Corinthians',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 10000, priceCents: 82000 },
          { name: 'Pista', initialQuantity: 15000, priceCents: 60000 },
          { name: 'Cadeira Inferior', initialQuantity: 12000, priceCents: 54000 },
          { name: 'Cadeira Superior', initialQuantity: 12000, priceCents: 43000 },
          { name: 'Arquibancada', initialQuantity: 33000, priceCents: 38000 },
        ],
      },
      {
        startsAt: at(daysFromNow(17), 20, 0),
        venueName: 'Estádio do Morumbis',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista Premium A/B', initialQuantity: 15000, priceCents: 84000 },
          { name: 'Pista', initialQuantity: 28000, priceCents: 53000 },
          { name: 'Cadeira Inferior', initialQuantity: 3333, priceCents: 70000 },
          { name: 'Cadeira Superior', initialQuantity: 14000, priceCents: 48000 },
          { name: 'Arquibancada', initialQuantity: 22000, priceCents: 41000 },
        ],
      },
      {
        startsAt: at(daysFromNow(25), 21, 0),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 3000, priceCents: 52000 },
          { name: 'Pista Premium', initialQuantity: 1500, priceCents: 76000 },
          { name: 'Camarote', initialQuantity: 400, priceCents: 100000 },
          { name: 'Mezanino', initialQuantity: 1600, priceCents: 42000 },
        ],
      },
    ],
  },
  {
    title: 'Kenny G',
    slug: 'kenny-g',
    shortDescription: 'Kenny G Live no Brasil',
    heroPublicId: 'kenny-g',
    performances: [
      {
        startsAt: at(daysFromNow(10), 21, 0),
        venueName: 'Espaço Unimed',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2600, priceCents: 42000 },
          { name: 'Poltrona VIP', initialQuantity: 800, priceCents: 68000 },
          { name: 'Mezanino', initialQuantity: 1500, priceCents: 36000 },
          { name: 'Camarote', initialQuantity: 300, priceCents: 95000 },
        ],
      },
      {
        startsAt: at(daysFromNow(13), 21, 0),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2800, priceCents: 40000 },
          { name: 'Poltrona VIP', initialQuantity: 700, priceCents: 65000 },
          { name: 'Mezanino', initialQuantity: 1600, priceCents: 35000 },
          { name: 'Camarote', initialQuantity: 300, priceCents: 90000 },
        ],
      },
      {
        startsAt: at(daysFromNow(20), 20, 0),
        venueName: 'Auditório Araújo Vianna',
        venueCity: 'Porto Alegre',
        venueState: 'RS',
        ticketTypes: [
          { name: 'Plateia A', initialQuantity: 700, priceCents: 55000 },
          { name: 'Plateia B', initialQuantity: 900, priceCents: 42000 },
          { name: 'Mezanino', initialQuantity: 700, priceCents: 36000 },
        ],
      },
    ],
  },
  {
    title: 'Benito di Paula',
    slug: 'benito-di-paula',
    shortDescription: 'Benito di Paula em turnê',
    heroPublicId: 'benito-di-paula',
    performances: [
      {
        startsAt: at(daysFromNow(11), 20, 30),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2500, priceCents: 36000 },
          { name: 'Poltrona VIP', initialQuantity: 800, priceCents: 55000 },
          { name: 'Mezanino', initialQuantity: 1500, priceCents: 30000 },
          { name: 'Camarote', initialQuantity: 300, priceCents: 85000 },
        ],
      },
      {
        startsAt: at(daysFromNow(19), 20, 0),
        venueName: 'Espaço Unimed',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2800, priceCents: 38000 },
          { name: 'Poltrona VIP', initialQuantity: 900, priceCents: 58000 },
          { name: 'Mezanino', initialQuantity: 1600, priceCents: 32000 },
          { name: 'Camarote', initialQuantity: 300, priceCents: 90000 },
        ],
      },
      {
        startsAt: at(daysFromNow(28), 20, 0),
        venueName: 'Classic Hall',
        venueCity: 'Olinda Recife',
        venueState: 'PE',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 4500, priceCents: 32000 },
          { name: 'Front Stage', initialQuantity: 2200, priceCents: 48000 },
          { name: 'Camarote', initialQuantity: 600, priceCents: 90000 },
        ],
      },
    ],
  },
  {
    title: 'Sérgio Reis',
    slug: 'sergio-reis',
    shortDescription: 'Clássicos da música sertaneja',
    heroPublicId: 'sergio-reis',
    performances: [
      {
        startsAt: at(daysFromNow(14), 20, 0),
        venueName: 'Vibra São Paulo',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2500, priceCents: 38000 },
          { name: 'Poltrona VIP', initialQuantity: 800, priceCents: 58000 },
          { name: 'Mezanino', initialQuantity: 1500, priceCents: 33000 },
          { name: 'Camarote', initialQuantity: 300, priceCents: 88000 },
        ],
      },
      {
        startsAt: at(daysFromNow(22), 21, 0),
        venueName: 'Classic Hall',
        venueCity: 'Olinda Recife',
        venueState: 'PE',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 4200, priceCents: 30000 },
          { name: 'Front Stage', initialQuantity: 1800, priceCents: 46000 },
          { name: 'Camarote', initialQuantity: 500, priceCents: 82000 },
        ],
      },
    ],
  },
  {
    title: 'Kendrick Lamar',
    slug: 'kendrick-lamar',
    shortDescription: 'Turnê especial com convidados',
    heroPublicId: 'kendrick-lamar',
    performances: [
      {
        startsAt: at(daysFromNow(21), 21, 0),
        venueName: 'Arena BRB Mané Garrincha',
        venueCity: 'Brasília',
        venueState: 'DF',
        ticketTypes: [
          { name: 'Pista Premium', initialQuantity: 12000, priceCents: 78000 },
          { name: 'Pista', initialQuantity: 20000, priceCents: 52000 },
          { name: 'Cadeira', initialQuantity: 15000, priceCents: 45000 },
          { name: 'Arquibancada', initialQuantity: 25000, priceCents: 36000 },
        ],
      },
      {
        startsAt: at(daysFromNow(29), 21, 30),
        venueName: 'Estádio Couto Pereira',
        venueCity: 'Curitiba',
        venueState: 'PR',
        ticketTypes: [
          { name: 'Pista Premium', initialQuantity: 9000, priceCents: 76000 },
          { name: 'Pista', initialQuantity: 16000, priceCents: 50000 },
          { name: 'Cadeira', initialQuantity: 12000, priceCents: 42000 },
          { name: 'Arquibancada', initialQuantity: 18000, priceCents: 34000 },
        ],
      },
    ],
  },
  {
    title: 'Kacey Musgraves',
    slug: 'kacey-musgraves',
    shortDescription: 'Kacey Musgraves em turnê no Brasil.',
    heroPublicId: 'kacey-musgraves',
    performances: [
      {
        startsAt: at(daysFromNow(14), 21, 0),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista Premium', initialQuantity: 1200, priceCents: 68000 },
          { name: 'Pista', initialQuantity: 2500, priceCents: 42000 },
          { name: 'Cadeira', initialQuantity: 1800, priceCents: 52000 },
          { name: 'Camarote', initialQuantity: 300, priceCents: 95000 },
        ],
      },
    ],
  },
  {
    title: 'Samba 90 Graus',
    slug: 'samba-90-graus',
    shortDescription: 'Clássicos do samba ao vivo.',
    heroPublicId: 'samba-90-graus',
    performances: [
      {
        startsAt: at(daysFromNow(10), 20, 30),
        venueName: 'Multiplan Hall São Caetano',
        venueCity: 'São Caetano do Sul',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 3000, priceCents: 28000 },
          { name: 'Pista Premium', initialQuantity: 1000, priceCents: 42000 },
          { name: 'Camarote', initialQuantity: 250, priceCents: 70000 },
        ],
      },
    ],
  },
  {
    title: 'Alcione',
    slug: 'alcione',
    shortDescription: 'A Marrom com seus grandes sucessos.',
    heroPublicId: 'alcione',
    performances: [
      {
        startsAt: at(daysFromNow(18), 21, 0),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Poltrona', initialQuantity: 1800, priceCents: 38000 },
          { name: 'Poltrona VIP', initialQuantity: 600, priceCents: 52000 },
          { name: 'Camarote', initialQuantity: 200, priceCents: 85000 },
        ],
      },
    ],
  },
  {
    title: 'Jeff Mills',
    slug: 'jeff-mills',
    shortDescription: 'Lenda do techno em apresentação única.',
    heroPublicId: 'jeff-mills',
    performances: [
      {
        startsAt: at(daysFromNow(22), 23, 0),
        venueName: 'Multiplan Hall Ribeirão',
        venueCity: 'Ribeirão Preto',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2500, priceCents: 32000 },
          { name: 'Pista Premium', initialQuantity: 800, priceCents: 52000 },
          { name: 'Camarote', initialQuantity: 200, priceCents: 90000 },
        ],
      },
    ],
  },
  {
    title: 'Titãs (São Caetano do Sul)',
    slug: 'titas-sao-caetano-do-sul',
    shortDescription: 'Titãs em show especial no ABC.',
    heroPublicId: 'titas-sao-caetano-do-sul',
    performances: [
      {
        startsAt: at(daysFromNow(25), 21, 0),
        venueName: 'Multiplan Hall São Caetano',
        venueCity: 'São Caetano do Sul',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 3000, priceCents: 36000 },
          { name: 'Cadeira', initialQuantity: 1500, priceCents: 42000 },
          { name: 'Camarote', initialQuantity: 200, priceCents: 88000 },
        ],
      },
    ],
  },
  {
    title: 'The Sisters of Mercy',
    slug: 'the-sisters-of-mercy',
    shortDescription: 'Post-punk e atmosferas sombrias.',
    heroPublicId: 'the-sisters-of-mercy',
    performances: [
      {
        startsAt: at(daysFromNow(30), 21, 0),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2400, priceCents: 42000 },
          { name: 'Pista Premium', initialQuantity: 900, priceCents: 62000 },
          { name: 'Camarote', initialQuantity: 200, priceCents: 98000 },
        ],
      },
    ],
  },

  // EXPERIÊNCIAS — “Para toda a Família”
  {
    title: 'Sampa Sky',
    slug: 'sampasky',
    shortDescription: 'Mirante com chão de vidro no centro de SP.',
    heroPublicId: 'sampasky',
    performances: [
      {
        startsAt: at(daysFromNow(7), 10, 0),
        venueName: 'Sampa Sky',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Inteira', initialQuantity: 500, priceCents: 9000 },
          { name: 'Meia', initialQuantity: 300, priceCents: 4500 },
        ],
      },
    ],
  },
  {
    title: 'Júlio Verne',
    slug: 'julio-verne',
    shortDescription: 'Exposição imersiva inspirada em Júlio Verne.',
    heroPublicId: 'julio-verne',
    performances: [
      {
        startsAt: at(daysFromNow(11), 11, 0),
        venueName: 'Júlio Verne Experience',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Inteira', initialQuantity: 600, priceCents: 12000 },
          { name: 'Meia', initialQuantity: 400, priceCents: 6000 },
        ],
      },
    ],
  },
  {
    title: 'Roda Rico',
    slug: 'roda-rico',
    shortDescription: 'A maior roda-gigante da América Latina.',
    heroPublicId: 'roda-rico',
    performances: [
      {
        startsAt: at(daysFromNow(9), 15, 0),
        venueName: 'Roda Rico',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Gôndola Compartilhada', initialQuantity: 800, priceCents: 6000 },
          { name: 'Gôndola Exclusiva', initialQuantity: 50, priceCents: 150000 },
        ],
      },
    ],
  },
  {
    title: 'SP Gastronomia 2025',
    slug: 'sp-gastronomia-2025',
    shortDescription: 'Festival gastronômico com experiências para a família.',
    heroPublicId: 'sp-gastronomia-2025',
    performances: [
      {
        startsAt: at(daysFromNow(20), 12, 0),
        venueName: 'SP Gastronomia 2025',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [{ name: 'Passaporte Dia', initialQuantity: 2000, priceCents: 2000 }],
      },
    ],
  },
  {
    title: 'Zoo São Paulo',
    slug: 'zoo-sao-paulo',
    shortDescription: 'Visita ao Zoológico de São Paulo.',
    heroPublicId: 'zoo-sao-paulo',
    performances: [
      {
        startsAt: at(daysFromNow(8), 9, 0),
        venueName: 'Zoo de São Paulo',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Inteira', initialQuantity: 1500, priceCents: 6000 },
          { name: 'Meia', initialQuantity: 1500, priceCents: 3000 },
        ],
      },
    ],
  },
  {
    title: 'Napoleo Experience São Paulo',
    slug: 'napoleo-experience-sao-paulo',
    shortDescription: 'Exposição imersiva sobre Napoleão.',
    heroPublicId: 'napoleo-experience-sao-paulo',
    performances: [
      {
        startsAt: at(daysFromNow(16), 14, 0),
        venueName: 'Napoleo Experience São Paulo',
        venueCity: 'São Paulo',
        venueState: 'SP',
        ticketTypes: [
          { name: 'Inteira', initialQuantity: 600, priceCents: 14000 },
          { name: 'Meia', initialQuantity: 400, priceCents: 7000 },
        ],
      },
    ],
  },
  {
    title: 'Teatro Mágico no Qualistage (RJ)',
    slug: 'teatro-magico-no-qualistage-rj',
    shortDescription: 'O Teatro Mágico ao vivo no Qualistage.',
    heroPublicId: 'teatro-magico-no-qualistage-rj',
    performances: [
      {
        startsAt: at(daysFromNow(12), 20, 0),
        venueName: 'Qualistage',
        venueCity: 'Rio de Janeiro',
        venueState: 'RJ',
        ticketTypes: [
          { name: 'Pista', initialQuantity: 2500, priceCents: 28000 },
          { name: 'Poltrona VIP', initialQuantity: 600, priceCents: 52000 },
        ],
      },
    ],
  },
  {
    title: 'Festival Ver-o-Peso da Cozinha Paraense',
    slug: 'festival-ver-o-peso-da-cozinha-paraense',
    shortDescription: 'Sabores do Pará em um grande festival.',
    heroPublicId: 'festival-ver-o-peso-da-cozinha-paraense',
    performances: [
      {
        startsAt: at(daysFromNow(26), 12, 0),
        venueName: 'Centro de Convenções Hangar',
        venueCity: 'Belém',
        venueState: 'PA',
        ticketTypes: [{ name: 'Passaporte', initialQuantity: 4000, priceCents: 3000 }],
      },
    ],
  },
];

const venueKey = (n: string, c: string, s: string) =>
  JSON.stringify({ name: n.trim(), city: c.trim(), state: s.trim().toUpperCase() });

const knownVenues = new Set(venues.map((v) => venueKey(v.name, v.city, v.state)));

for (const e of events) {
  for (const p of e.performances) {
    const key = venueKey(p.venueName, p.venueCity, p.venueState);
    if (!knownVenues.has(key)) {
      console.error('❌ Venue não encontrado no seed de venues:', key, 'no evento:', e.title);
    }
  }
}

async function seedVenues() {
  for (const v of venues) {
    const base = `${v.name} ${v.city} ${v.state}`;
    const slug = toSlug(base);
    await prisma.venue.upsert({
      where: {
        name_city_state: { name: v.name, city: v.city, state: v.state },
      },
      update: {
        address: v.address ?? null,
        capacity: v.capacity ?? null,
        coverPublicId: (v as any).coverPublicId ?? null,
        slug,
      },
      create: {
        name: v.name,
        city: v.city,
        state: v.state,
        ...opt('address', v.address),
        ...opt('capacity', v.capacity),
        coverPublicId: toNull(v.coverPublicId),
        slug,
      },
    });
  }
}

async function seedEventsGraph() {
  for (const e of events) {
    const event = await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        title: e.title,
        shortDescription: e.shortDescription,
        heroPublicId: e.heroPublicId ?? null,
      },
      create: {
        title: e.title,
        slug: e.slug,
        shortDescription: e.shortDescription,
        heroPublicId: toNull(e.heroPublicId),
      },
      select: { id: true },
    });

    for (const p of e.performances) {
      const venue = await prisma.venue.findUniqueOrThrow({
        where: { name_city_state: { name: p.venueName, city: p.venueCity, state: p.venueState } },
        select: { id: true },
      });

      let perf = await prisma.performance.findFirst({
        where: { eventId: event.id, startsAt: p.startsAt },
        select: { id: true },
      });

      if (!perf) {
        perf = await prisma.performance.create({
          data: {
            eventId: event.id,
            startsAt: p.startsAt,
            endsAt: p.endsAt ?? null,
            venueId: venue.id,
          },
          select: { id: true },
        });
      } else {
        await prisma.performance.update({
          where: { id: perf.id },
          data: { endsAt: p.endsAt ?? null, venueId: venue.id },
        });
      }

      for (const t of p.ticketTypes) {
        const tt = await prisma.ticketType.upsert({
          where: {
            performanceId_name: { performanceId: perf.id, name: t.name },
          },
          update: {
            priceCents: t.priceCents,
            initialQuantity: t.initialQuantity,
          },
          create: {
            performanceId: perf.id,
            name: t.name,
            priceCents: t.priceCents,
            initialQuantity: t.initialQuantity,
          },
          select: { id: true, initialQuantity: true },
        });

        await prisma.inventory.upsert({
          where: { ticketTypeId: tt.id },
          update: {
            available: t.initialQuantity,
          },
          create: {
            ticketTypeId: tt.id,
            available: t.initialQuantity,
          },
        });
        await prisma.ticketVariant.createMany({
          data: [
            {
              ticketTypeId: tt.id,
              kind: 'FULL',
              priceCents: t.priceCents,
              feeCents: Math.round(t.priceCents * 0.15),
              discountPct: 0,
            },
            {
              ticketTypeId: tt.id,
              kind: 'HALF',
              priceCents: Math.round(t.priceCents / 2),
              feeCents: Math.round(t.priceCents * 0.15),
              discountPct: 50,
            },
            {
              ticketTypeId: tt.id,
              kind: 'ELDERLY',
              priceCents: Math.round(t.priceCents / 2),
              feeCents: Math.round(t.priceCents * 0.15),
              discountPct: 50,
            },
            {
              ticketTypeId: tt.id,
              kind: 'PCD',
              priceCents: Math.round(t.priceCents / 2),
              feeCents: Math.round(t.priceCents * 0.15),
              discountPct: 50,
            },
          ],
        });
      }
    }
  }
}

async function main() {
  await resetDatabase();
  await seedVenues();
  await seedEventsGraph();
}

main()
  .then(async () => {
    console.log('✅ Seed concluído.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed falhou:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
