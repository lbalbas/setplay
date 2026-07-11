import { type Game, type Event } from "../server/db/schema";

export interface MockStream {
  id: string;
  channelName: string;
  displayName: string;
  title: string;
  viewerCount: number;
  gameId: string;
  gameName: string;
  thumbnailUrl?: string;
  type: "tournament" | "ranked" | "casual" | "pro_play";
  eventId: string | null;
  eventName: string | null;
  matchMetadata: string | null;
}

export interface HeadlineFeaturedStream extends MockStream {
  featuredTitle: string;
  peakViewers: string;
  duration: string;
  prizePool: string;
  bracketUrl?: string;
}

// 1. Mock Games (Matching the database schema)
export const MOCK_GAMES: Game[] = [
  {
    id: "518605", // Twitch Game ID
    name: "Street Fighter 6",
    slug: "sf6",
    startggId: 43868,
  },
  {
    id: "1811568203",
    name: "Tekken 8",
    slug: "t8",
    startggId: 49783,
  },
  {
    id: "2085304958",
    name: "Guilty Gear -Strive-",
    slug: "ggst",
    startggId: 33990,
  },
  {
    id: "497385",
    name: "Dragon Ball FighterZ",
    slug: "dbfz",
    startggId: 10,
  },
  {
    id: "973167198",
    name: "Under Night In-Birth II Sys:Celes",
    slug: "uni2",
    startggId: 50821,
  },
  {
    id: "16260",
    name: "Super Smash Bros. Melee",
    slug: "ssbm",
    startggId: 1,
  },
];

// 2. Mock Events (Matching the database schema)
export const MOCK_EVENTS: Event[] = [
  {
    id: "evo-2026",
    name: "EVO 2026",
    slug: "evo-2026",
    source: "start_gg",
    startggSlug: "tournament/evo-2026",
    startDate: new Date("2026-06-11T12:00:00Z"),
    endDate: new Date("2026-06-13T23:59:59Z"),
    region: "NA",
    isOnline: false,
    registrationUrl: "https://start.gg/tournament/evo-2026",
    featuredPriority: "headline",
    status: "live",
  },
  {
    id: "combo-breaker-2026",
    name: "Combo Breaker 2026",
    slug: "combo-breaker-2026",
    source: "start_gg",
    startggSlug: "tournament/combo-breaker-2026",
    startDate: new Date("2026-06-25T12:00:00Z"),
    endDate: new Date("2026-06-27T23:59:59Z"),
    region: "NA",
    isOnline: false,
    registrationUrl: "https://start.gg/tournament/combo-breaker-2026",
    featuredPriority: "featured",
    status: "upcoming",
  },
  {
    id: "ceo-2026",
    name: "CEO 2026",
    slug: "ceo-2026",
    source: "manual",
    startggSlug: null,
    startDate: new Date("2026-07-02T12:00:00Z"),
    endDate: new Date("2026-07-04T23:59:59Z"),
    region: "NA",
    isOnline: false,
    registrationUrl: "https://ceogaming.org",
    featuredPriority: "normal",
    status: "upcoming",
  },
];

// 3. Mock Headline Featured Stream (EVO 2026 SF6 Grand Finals)
export const MOCK_HEADLINE_STREAM: HeadlineFeaturedStream = {
  id: "evo-sf6-finals",
  channelName: "evo",
  displayName: "EVO_Official",
  title: "EVO 2026 — Street Fighter 6 Grand Finals",
  viewerCount: 42147,
  gameId: "518605",
  gameName: "Street Fighter 6",
  type: "tournament",
  eventId: "evo-2026",
  eventName: "EVO 2026",
  matchMetadata: "Grand Finals - In Progress",
  featuredTitle: "EVO 2026 — Street Fighter 6 Grand Finals",
  peakViewers: "58.2K",
  duration: "4h 22m",
  prizePool: "$50,000",
  bracketUrl: "https://start.gg/tournament/evo-2026/event/street-fighter-6",
};

// 4. Mock Streams (Mix of Pinned Tournaments, Pro Play, and Casual play)
export const MOCK_STREAMS: MockStream[] = [
  // Pinned Tournaments
  {
    id: "str_1",
    channelName: "nuckledu",
    displayName: "NuckleDu",
    title: "EVO 2026 - CPT QUALIFIER | Pools to Top 8",
    viewerCount: 42100,
    gameId: "518605",
    gameName: "Street Fighter 6",
    type: "tournament",
    eventId: "evo-2026",
    eventName: "EVO 2026",
    matchMetadata: "Pools - Winner's Bracket",
  },
  {
    id: "str_2",
    channelName: "evo2",
    displayName: "Evo2",
    title: "CPT 2026 - REGIONAL FINALS | Tekken 8 Bracket",
    viewerCount: 18300,
    gameId: "1811568203",
    gameName: "Tekken 8",
    type: "tournament",
    eventId: "evo-2026",
    eventName: "EVO 2026",
    matchMetadata: "Top 8 Arena",
  },
  {
    id: "str_3",
    channelName: "tampaneversleeps",
    displayName: "TampaNeverSleeps",
    title: "THE MOMENTUM 2026 - Guilty Gear Strive pools",
    viewerCount: 11700,
    gameId: "2085304958",
    gameName: "Guilty Gear -Strive-",
    type: "tournament",
    eventId: "evo-2026",
    eventName: "EVO 2026",
    matchMetadata: "Winner's Bracket",
  },

  // Pro Players
  {
    id: "str_4",
    channelName: "punkdagod",
    displayName: "PunkDaGod",
    title: "Ranked matches, grinding to Master | SF6 chill stream",
    viewerCount: 3400,
    gameId: "518605",
    gameName: "Street Fighter 6",
    type: "pro_play",
    eventId: null,
    eventName: null,
    matchMetadata: null,
  },
  {
    id: "str_5",
    channelName: "arslanash",
    displayName: "Arslan Ash",
    title: "Tekken 8 practice, preparing for next major",
    viewerCount: 2900,
    gameId: "1811568203",
    gameName: "Tekken 8",
    type: "pro_play",
    eventId: null,
    eventName: null,
    matchMetadata: null,
  },
  {
    id: "str_6",
    channelName: "leffen",
    displayName: "Leffen",
    title: "UNI2 practice and grinding lobbies",
    viewerCount: 1200,
    gameId: "973167198",
    gameName: "Under Night In-Birth II Sys:Celes",
    type: "pro_play",
    eventId: null,
    eventName: null,
    matchMetadata: null,
  },

  // Ranked / Lobbies
  {
    id: "str_7",
    channelName: "mang0",
    displayName: "mang0",
    title: "Melee Netplay - falco only today",
    viewerCount: 2500,
    gameId: "16260",
    gameName: "Super Smash Bros. Melee",
    type: "ranked",
    eventId: null,
    eventName: null,
    matchMetadata: null,
  },
  {
    id: "str_8",
    channelName: "sonicfox",
    displayName: "SonicFox",
    title: "MK1 casual lobbies with chat, come join!",
    viewerCount: 1800,
    gameId: "497385", // Using DBFZ placeholder game id here for demo
    gameName: "Dragon Ball FighterZ",
    type: "casual",
    eventId: null,
    eventName: null,
    matchMetadata: null,
  },
];
