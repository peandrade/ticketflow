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
    description: string;
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
      description: 'Bruno Mars é cantor, compositor e multi-instrumentista vencedor de múltiplos Grammys. No palco, ele mistura soul, funk e pop com banda completa e um poderoso naipe de metais. O espetáculo traz luzes coreografadas, passinhos em sincronia e uma sequência de hits que dominaram as rádios brasileiras: “Uptown Funk”, “24K Magic”, “Locked Out of Heaven”, “Treasure”, “Grenade” e “Just The Way You Are”. A produção é grandiosa, com vocais impecáveis, interações bem-humoradas e momentos em que a plateia vira um coral. É o tipo de show para cantar alto e sair com glitter imaginário nos ombros.',
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
          startsAt: at(daysFromNow(120), 20, 30),
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
          startsAt: at(daysFromNow(190), 21, 30),
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
      description: 'Dua Lipa apresenta uma celebração de pop moderno com estética disco e coreografias afiadas. O setlist passa por “New Rules”, “IDGAF”, “Don’t Start Now”, “Levitating”, “Physical”, além de faixas novas. No Brasil, suas músicas lideraram paradas de streaming e embalaram festas e academias. Em cena, lasers, leds e um corps de dança transformam o palco numa pista gigante. A artista mantém presença magnética, alternando números explosivos com momentos intimistas, sempre com voz firme e carisma alto.',
      heroPublicId: 'dua-lipa',
      performances: [
        {
          startsAt: at(daysFromNow(70), 21, 0),
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
          startsAt: at(daysFromNow(160), 20, 30),
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
          startsAt: at(daysFromNow(230), 21, 0),
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
      description: 'Post Malone costura trap, pop e rock com banda ao vivo e intervenções acústicas. Telões imersivos e fogos pontuais sublinham sucessos massivos como “Rockstar”, “Sunflower”, “Circles”, “Congratulations” e “Better Now”, todos muito populares no Brasil. A performance alterna explosão e vulnerabilidade, com o cantor falando com o público e brindando a energia da plateia. Para quem gosta de refrões gigantes e guitarras com auto-tune na medida certa.',
      heroPublicId: 'post-malone',
      performances: [
        {
          startsAt: at(daysFromNow(90), 21, 0),
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
          startsAt: at(daysFromNow(180), 20, 30),
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
          startsAt: at(daysFromNow(260), 21, 30),
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
      description: 'Travis Scott entrega uma experiência cinematográfica de hip-hop: graves monstruosos, cenários temáticos e uma sucessão de bangers que fazem o chão tremer. O roteiro une faixas de “UTOPIA” a clássicos como “SICKO MODE”, “goosebumps” e “HIGHEST IN THE ROOM”. A estética é de parque de diversões futurista, com luzes e elementos cenográficos que amplificam o mosh coletivo. No Brasil, o rapper é figura de streaming e headliner, com público fiel que sabe cada verso.',
      heroPublicId: 'travis-scott',
      performances: [
        {
          startsAt: at(daysFromNow(60), 20, 0),
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
          startsAt: at(daysFromNow(150), 21, 30),
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
          startsAt: at(daysFromNow(240), 21, 30),
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
      description: 'Matuê é um fenômeno do trap nacional. O show combina VJ, banda e beats de impacto, com refrões que a plateia brasileira canta palavra por palavra. No set, “Quer Voar”, “Kenny G”, “Vampiro”, “A Morte do Autotune” e destaques do álbum “Máquina do Tempo”. Entre efeitos visuais e pirotecnia controlada, o artista intercala momentos de diálogo com a multidão e explosões de energia, consolidando sua posição como um dos maiores do gênero no país.',
      heroPublicId: 'matue',
      performances: [
        {
          startsAt: at(daysFromNow(80), 20, 30),
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
          startsAt: at(daysFromNow(170), 20, 0),
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
          startsAt: at(daysFromNow(250), 21, 0),
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
      description: 'Kenny G traz um concerto de smooth jazz com a sonoridade inconfundível do sax soprano. O repertório costuma incluir “Songbird”, “Silhouette”, “Forever in Love” e improvisos delicados que mostram fraseado e respiração circular. A banda cria uma cama harmônica luminosa, enquanto o público aproveita um clima intimista e elegante. Uma noite para quem busca musicalidade refinada e memórias de trilhas sonoras que atravessaram gerações no Brasil.',
      heroPublicId: 'kenny-g',
      performances: [
        {
          startsAt: at(daysFromNow(100), 21, 0),
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
          startsAt: at(daysFromNow(130), 21, 0),
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
          startsAt: at(daysFromNow(200), 20, 0),
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
      description: 'Benito di Paula, ícone do samba romântico, conduz um passeio afetivo por clássicos como “Retalhos de Cetim”, “Do Jeito Que a Vida Quer”, “Mulher Brasileira” e “Charlie Brown”. Ao piano, ele narra histórias, sorri com a banda e convida o público a cantar refrões que fazem parte da memória brasileira. Arranjos atuais preservam a essência do artista, unindo nostalgia e calor humano em igual medida.',
      heroPublicId: 'benito-di-paula',
      performances: [
        {
          startsAt: at(daysFromNow(110), 20, 30),
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
          startsAt: at(daysFromNow(190), 20, 0),
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
          startsAt: at(daysFromNow(280), 20, 0),
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
      description: 'Sérgio Reis oferece um mergulho na música sertaneja de raiz com viola, sanfona e banda completa. A plateia canta junto em “Panela Velha”, “O Menino da Porteira” e “Coração de Papel”. Entre causos de estrada e homenagens aos mestres, o show celebra tradições que moldaram a cultura do campo e ecoam nas cidades. Um encontro de gerações em torno de melodias eternas.',
      heroPublicId: 'sergio-reis',
      performances: [
        {
          startsAt: at(daysFromNow(140), 20, 0),
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
          startsAt: at(daysFromNow(220), 21, 0),
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
      description: 'Kendrick Lamar, referência máxima do rap contemporâneo, constrói uma apresentação com narrativa visual, coreografia precisa e rimas que atravessam temas sociais. O set destaca “HUMBLE.”, “DNA.”, “Alright”, “King Kunta” e “Money Trees”. No Brasil, o artista coleciona fãs devotos, que transformam os versos em mantra coletivo. É arte e performance em alta definição.',
      heroPublicId: 'kendrick-lamar',
      performances: [
        {
          startsAt: at(daysFromNow(210), 21, 0),
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
          startsAt: at(daysFromNow(290), 21, 30),
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
      description: 'Kacey Musgraves traz um country-pop de arranjos luminosos, com destaque para letras confessionais e vocais cristalinos. O show transita por “Slow Burn”, “Rainbow”, “Golden Hour” e composições recentes. A iluminação cria um ambiente quente e acolhedor, enquanto a banda desenha paisagens sonoras elegantes. Para quem aprecia melodias bonitas e histórias bem contadas.',
      heroPublicId: 'kacey-musgraves',
      performances: [
        {
          startsAt: at(daysFromNow(140), 21, 0),
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
      description: 'Uma roda de samba turbinada: percussão marcante, cavaquinho em evidência e coro coletivo. O repertório revisita clássicos dos anos 80 e 90, com arranjos modernos que mantêm o suingue tradicional. É para sambar, cantar junto e recordar hits que embalaram rádios, churrascos e pagodes pelo Brasil.',
      heroPublicId: 'samba-90-graus',
      performances: [
        {
          startsAt: at(daysFromNow(100), 20, 30),
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
      shortDescription: 'A Mulher com seus grandes sucessos.',
      description: 'A Mulher sobe ao palco com um naipe de metais potente e uma presença cênica magnética. O público canta alto “Não Deixe o Samba Morrer”, “Você Me Vira a Cabeça”, “A Loba” e “Meu Ébano”. Entre sambas-canção e momentos de carnaval, Alcione entrega emoção, técnica e generosidade com a plateia — marca registrada de uma das maiores vozes do país.',
      heroPublicId: 'alcione',
      performances: [
        {
          startsAt: at(daysFromNow(180), 21, 0),
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
      description: 'Jeff Mills, lenda de Detroit, conduz um set de techno minimalista e hipnótico. Mixagens cirúrgicas, texturas sintéticas e crescendos que mantêm a pista em transe. “The Bells” costuma aparecer como catarse coletiva. Para fãs de música eletrônica, é história viva do gênero em performance.',
      heroPublicId: 'jeff-mills',
      performances: [
        {
          startsAt: at(daysFromNow(220), 23, 0),
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
      description: 'Titãs revisit am décadas de rock brasileiro com guitarras à frente e coro de estádio. “Epitáfio”, “Sonífera Ilha”, “Flores”, “Pra Dizer Adeus” e “Marvin” dão o tom de um repertório que atravessa gerações. A banda mantém energia alta e entrega um show catártico, sem economizar nos hinos.',
      heroPublicId: 'titas-sao-caetano-do-sul',
      performances: [
        {
          startsAt: at(daysFromNow(250), 21, 0),
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
      description: 'The Sisters of Mercy oferece um pós-punk gótico de atmosferas densas: batidas programadas, linhas de baixo hipnóticas e vocais graves. Destaques recorrentes incluem “This Corrosion”, “Temple of Love” e “Lucretia My Reflection”. Visual escuro com fumaça e luz recortada completa a experiência cult.',
      heroPublicId: 'the-sisters-of-mercy',
      performances: [
        {
          startsAt: at(daysFromNow(300), 21, 0),
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
    {
      title: 'Sampa Sky',
      slug: 'sampasky',
      shortDescription: 'Mirante com chão de vidro no centro de SP.',
      description: 'Mirante com piso de vidro e vista 360º do Centro Histórico de São Paulo. As sessões são cronometradas para garantir a experiência nas sacadas de vidro, com orientação de segurança e serviço de fotos. Ideal para registros inesquecíveis e para quem quer ver a cidade de um novo ângulo.',
      heroPublicId: 'sampasky',
      performances: [
        {
          startsAt: at(daysFromNow(70), 10, 0),
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
      description: 'Exposição imersiva inspirada nas obras de Júlio Verne, com projeções 360º, salas temáticas e trilha original. O visitante atravessa ambientes que remetem a “Viagem ao Centro da Terra” e “Vinte Mil Léguas Submarinas”, unindo literatura, ciência e fantasia para todas as idades.',
      heroPublicId: 'julio-verne',
      performances: [
        {
          startsAt: at(daysFromNow(110), 11, 0),
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
      description: 'Roda-gigante com gôndolas climatizadas e vista panorâmica do Parque Cândido Portinari e do skyline paulistano. Opções de gôndola compartilhada ou exclusiva, perfeita para comemorações e fotos. Experiência segura, confortável e instagramável.',
      heroPublicId: 'roda-rico',
      performances: [
        {
          startsAt: at(daysFromNow(90), 15, 0),
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
      description: 'Festival com dezenas de expositores, aulas-show com chefs convidados, talks, área kids e ativações temáticas. O passaporte diário dá acesso às experiências, degustações e palcos. Um passeio para descobrir ingredientes, técnicas e tendências da cena culinária brasileira.',
      heroPublicId: 'sp-gastronomia-2025',
      performances: [
        {
          startsAt: at(daysFromNow(200), 12, 0),
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
      description: 'Ingresso datado para explorar um dos maiores zoológicos do país. Trilhas sinalizadas, áreas temáticas e programas de conservação apresentam biodiversidade e educação ambiental. Uma atividade completa para famílias e amantes da natureza.',
      heroPublicId: 'zoo-sao-paulo',
      performances: [
        {
          startsAt: at(daysFromNow(80), 9, 0),
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
      description: 'Percurso imersivo que narra a trajetória de Napoleão com projeções, peças reproduzidas e áudio-narração. A mostra contextualiza batalhas, símbolos e curiosidades do período napoleônico, convidando a caminhar pela história de modo sensorial.',
      heroPublicId: 'napoleo-experience-sao-paulo',
      performances: [
        {
          startsAt: at(daysFromNow(160), 14, 0),
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
      description: 'O Teatro Mágico une música, poesia, teatro e elementos circenses em um espetáculo único. Figurinos, números acrobáticos e canções queridas pelos fãs criam um ambiente de fantasia contemporânea, com participação ativa do público.',
      heroPublicId: 'teatro-magico-no-qualistage-rj',
      performances: [
        {
          startsAt: at(daysFromNow(120), 20, 0),
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
      description: 'Celebração da culinária paraense com chefs convidados, aulas, feirinha de produtores e música ao vivo. Ingredientes amazônicos como tucupi, jambu e açaí brilham em receitas clássicas e autorais, num mergulho de sabores, aromas e afetos.',
      heroPublicId: 'festival-ver-o-peso-da-cozinha-paraense',
      performances: [
        {
          startsAt: at(daysFromNow(260), 12, 0),
          venueName: 'Centro de Convenções Hangar',
          venueCity: 'Belém',
          venueState: 'PA',
          ticketTypes: [{ name: 'Passaporte', initialQuantity: 4000, priceCents: 3000 }],
        },
      ],
    },
    {
      title: 'Coldplay',
      slug: 'coldplay',
      shortDescription: 'Turnê de estádio com hits e participação do público.',
      description:
        'Coldplay retorna com um espetáculo de estádio repleto de luzes, pulseiras LED sincronizadas, confetes biodegradáveis e um repertório que atravessa gerações: “Yellow”, “Fix You”, “Viva La Vida”, “Paradise”, “A Sky Full of Stars” e destaques do álbum “Music of the Spheres”. A banda tem enorme público no Brasil e transforma a arquibancada em um grande coro.',
      heroPublicId: 'coldplay',
      performances: [
        {
          startsAt: at(daysFromNow(75), 21, 0),
          venueName: 'Estádio Nilton Santos',
          venueCity: 'Rio de Janeiro',
          venueState: 'RJ',
          ticketTypes: [
            { name: 'Pista Premium A/B', initialQuantity: 12000, priceCents: 98000 },
            { name: 'Pista', initialQuantity: 22000, priceCents: 68000 },
            { name: 'Cadeira', initialQuantity: 20000, priceCents: 56000 },
            { name: 'Arquibancada', initialQuantity: 26000, priceCents: 42000 },
          ],
        },
        {
          startsAt: at(daysFromNow(95), 21, 0),
          venueName: 'Estádio do Morumbis',
          venueCity: 'São Paulo',
          venueState: 'SP',
          ticketTypes: [
            { name: 'Pista Premium A/B', initialQuantity: 15000, priceCents: 99000 },
            { name: 'Pista', initialQuantity: 30000, priceCents: 69000 },
            { name: 'Cadeira', initialQuantity: 22000, priceCents: 57000 },
            { name: 'Arquibancada', initialQuantity: 28000, priceCents: 43000 },
          ],
        },
      ],
    },
    {
      title: 'Ivete Sangalo',
      slug: 'ivete-sangalo',
      shortDescription: 'Axé de alto astral com banda e ballet.',
      description:
        'Ivete coloca todo mundo para dançar com um espetáculo de axé-pop que mistura coreografias, banda potente e carisma inesgotável. Sucessos que o Brasil conhece de cor — “Sorte Grande”, “Quando a Chuva Passar”, “Tempo de Alegria”, “Festa” — aparecem em arranjos renovados. É alegria coletiva do primeiro ao último minuto.',
      heroPublicId: 'ivetesangalo',
      performances: [
        {
          startsAt: at(daysFromNow(130), 20, 30),
          venueName: 'Arena Corinthians',
          venueCity: 'São Paulo',
          venueState: 'SP',
          ticketTypes: [
            { name: 'Pista Premium', initialQuantity: 10000, priceCents: 68000 },
            { name: 'Pista', initialQuantity: 18000, priceCents: 42000 },
            { name: 'Cadeira', initialQuantity: 14000, priceCents: 36000 },
          ],
        },
        {
          startsAt: at(daysFromNow(145), 21, 0),
          venueName: 'Estádio Nilton Santos',
          venueCity: 'Rio de Janeiro',
          venueState: 'RJ',
          ticketTypes: [
            { name: 'Pista Premium', initialQuantity: 9000, priceCents: 64000 },
            { name: 'Pista', initialQuantity: 16000, priceCents: 40000 },
            { name: 'Cadeira', initialQuantity: 12000, priceCents: 34000 },
          ],
        },
        {
          startsAt: at(daysFromNow(170), 21, 0),
          venueName: 'Vibra São Paulo',
          venueCity: 'São Paulo',
          venueState: 'SP',
          ticketTypes: [
            { name: 'Pista', initialQuantity: 2500, priceCents: 42000 },
            { name: 'Pista Premium', initialQuantity: 900, priceCents: 64000 },
            { name: 'Camarote', initialQuantity: 220, priceCents: 120000 },
          ],
        },
      ],
    },
    {
      title: 'Lulu Santos',
      slug: 'lulu-santos',
      shortDescription: 'Pop brasileiro com guitarras e nostalgia.',
      description:
        'Lulu Santos desfila hinos do pop nacional com banda afiada e guitarras inconfundíveis. “Tempos Modernos”, “A Cura”, “Toda Forma de Amor”, “Assim Caminha a Humanidade” e “Apenas Mais Uma de Amor” fazem a plateia cantar do começo ao fim. Uma noite solar e bem-humorada, recheada de memórias.',
      heroPublicId: 'lulu-santos',
      performances: [
        {
          startsAt: at(daysFromNow(115), 21, 0),
          venueName: 'Vibra São Paulo',
          venueCity: 'São Paulo',
          venueState: 'SP',
          ticketTypes: [
            { name: 'Pista', initialQuantity: 2600, priceCents: 36000 },
            { name: 'Poltrona VIP', initialQuantity: 700, priceCents: 62000 },
            { name: 'Camarote', initialQuantity: 250, priceCents: 110000 },
          ],
        },
        {
          startsAt: at(daysFromNow(150), 20, 0),
          venueName: 'Auditório Araújo Vianna',
          venueCity: 'Porto Alegre',
          venueState: 'RS',
          ticketTypes: [
            { name: 'Plateia A', initialQuantity: 800, priceCents: 52000 },
            { name: 'Plateia B', initialQuantity: 900, priceCents: 38000 },
            { name: 'Mezanino', initialQuantity: 700, priceCents: 33000 },
          ],
        },
      ],
    },
    {
      title: 'Roupa Nova',
      slug: 'roupa-nova',
      shortDescription: 'Clássicos românticos e trilhas de novela.',
      description:
        'Roupa Nova reúne sucessos que embalaram novelas e rádios pelo Brasil: “Dona”, “Whisky a Go-Go”, “A Viagem”, “Coração Pirata” e muito mais. Harmonia vocal precisa, arranjos cheios de camadas e bom humor no palco fazem do show uma catarse afetiva.',
      heroPublicId: 'roupa-nova',
      performances: [
        {
          startsAt: at(daysFromNow(105), 21, 0),
          venueName: 'Classic Hall',
          venueCity: 'Olinda Recife',
          venueState: 'PE',
          ticketTypes: [
            { name: 'Pista', initialQuantity: 4500, priceCents: 36000 },
            { name: 'Front Stage', initialQuantity: 2000, priceCents: 52000 },
            { name: 'Camarote', initialQuantity: 600, priceCents: 90000 },
          ],
        },
        {
          startsAt: at(daysFromNow(135), 20, 30),
          venueName: 'Teatro Positivo',
          venueCity: 'Curitiba',
          venueState: 'PR',
          ticketTypes: [
            { name: 'Plateia A', initialQuantity: 900, priceCents: 42000 },
            { name: 'Plateia B', initialQuantity: 900, priceCents: 32000 },
            { name: 'Mezanino', initialQuantity: 600, priceCents: 28000 },
          ],
        },
        {
          startsAt: at(daysFromNow(160), 21, 0),
          venueName: 'Multiplan Hall São Caetano',
          venueCity: 'São Caetano do Sul',
          venueState: 'SP',
          ticketTypes: [
            { name: 'Pista', initialQuantity: 3200, priceCents: 36000 },
            { name: 'Pista Premium', initialQuantity: 1000, priceCents: 52000 },
            { name: 'Camarote', initialQuantity: 250, priceCents: 90000 },
          ],
        },
        {
          startsAt: at(daysFromNow(185), 21, 0),
          venueName: 'Multiplan Hall Ribeirão',
          venueCity: 'Ribeirão Preto',
          venueState: 'SP',
          ticketTypes: [
            { name: 'Pista', initialQuantity: 3000, priceCents: 34000 },
            { name: 'Pista Premium', initialQuantity: 900, priceCents: 50000 },
            { name: 'Camarote', initialQuantity: 200, priceCents: 88000 },
          ],
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
          description: e.description,
          heroPublicId: e.heroPublicId ?? null,
        },
        create: {
          title: e.title,
          slug: e.slug,
          shortDescription: e.shortDescription,
          description: e.description,
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
