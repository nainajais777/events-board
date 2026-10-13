export const CARD_THEMES = ["sunrise", "ocean", "night"] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

export const STICKER_IDS = ["music", "party", "star", "food", "sports"] as const;
export type StickerId = (typeof STICKER_IDS)[number];

export const STICKER_EMOJI: Record<StickerId, string> = {
  music: "🎵",
  party: "🎉",
  star: "⭐",
  food: "🍕",
  sports: "⚽",
};

export const MAX_STICKERS = 3;

export type CardDesign = { theme: CardTheme; stickers: StickerId[] };
export const DEFAULT_DESIGN: CardDesign = { theme: "sunrise", stickers: [] };