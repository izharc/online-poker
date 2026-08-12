export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export const SUITS = ["c", "d", "h", "s"] as const;
export type Rank = typeof RANKS[number];
export type Suit = typeof SUITS[number];
export interface Card { rank: Rank; suit: Suit }
export type HandCategory = "HIGH_CARD" | "PAIR" | "TWO_PAIR" | "THREE_OF_A_KIND" | "STRAIGHT" | "FLUSH" | "FULL_HOUSE" | "FOUR_OF_A_KIND" | "STRAIGHT_FLUSH";
export interface EvaluatedHand { category: HandCategory; score: number[]; cards: Card[] }
const rankValue = (rank: Rank) => RANKS.indexOf(rank) + 2;
const categories: HandCategory[] = ["HIGH_CARD", "PAIR", "TWO_PAIR", "THREE_OF_A_KIND", "STRAIGHT", "FLUSH", "FULL_HOUSE", "FOUR_OF_A_KIND", "STRAIGHT_FLUSH"];

export function parseCard(value: string): Card {
  if (!/^[2-9TJQKA][cdhs]$/.test(value)) throw new Error(`Invalid card: ${value}`);
  return { rank: value[0] as Rank, suit: value[1] as Suit };
}
export function createDeck(): Card[] { return SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit }))); }
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } return shuffled;
}
function straightHigh(cards: Card[]): number | undefined {
  const values = [...new Set(cards.map(c => rankValue(c.rank)))].sort((a, b) => b - a);
  if (values.includes(14)) values.push(1);
  for (let i = 0; i <= values.length - 5; i++) if (values.slice(i, i + 5).every((value, index, group) => index === 0 || group[index - 1] - value === 1)) return values[i];
  return undefined;
}
function evaluateFive(cards: Card[]): EvaluatedHand {
  const values = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a);
  const groups = [...new Map<number, number[]>()];
  for (const value of values) { const found = groups.find(([key]) => key === value); if (found) found[1].push(value); else groups.push([value, [value]]); }
  groups.sort((a, b) => b[1].length - a[1].length || b[0] - a[0]);
  const flush = cards.every(card => card.suit === cards[0].suit); const straight = straightHigh(cards);
  let category: HandCategory; let score: number[];
  if (flush && straight) { category = "STRAIGHT_FLUSH"; score = [straight]; }
  else if (groups[0][1].length === 4) { category = "FOUR_OF_A_KIND"; score = [groups[0][0], groups[1][0]]; }
  else if (groups[0][1].length === 3 && groups[1][1].length === 2) { category = "FULL_HOUSE"; score = [groups[0][0], groups[1][0]]; }
  else if (flush) { category = "FLUSH"; score = values; }
  else if (straight) { category = "STRAIGHT"; score = [straight]; }
  else if (groups[0][1].length === 3) { category = "THREE_OF_A_KIND"; score = [groups[0][0], ...groups.slice(1).map(group => group[0])]; }
  else if (groups[0][1].length === 2 && groups[1][1].length === 2) { category = "TWO_PAIR"; score = [groups[0][0], groups[1][0], groups[2][0]]; }
  else if (groups[0][1].length === 2) { category = "PAIR"; score = [groups[0][0], ...groups.slice(1).map(group => group[0])]; }
  else { category = "HIGH_CARD"; score = values; }
  return { category, score: [categories.indexOf(category), ...score], cards };
}
function combinations<T>(values: T[], size: number): T[][] { if (size === 0) return [[]]; if (values.length < size) return []; return combinations(values.slice(1), size - 1).map(group => [values[0], ...group]).concat(combinations(values.slice(1), size)); }
export function compareHands(left: EvaluatedHand, right: EvaluatedHand): number { for (let i = 0; i < Math.max(left.score.length, right.score.length); i++) { const delta = (left.score[i] ?? 0) - (right.score[i] ?? 0); if (delta) return Math.sign(delta); } return 0; }
export function evaluate(cards: Card[]): EvaluatedHand { if (cards.length < 5 || cards.length > 7) throw new Error("Evaluate between five and seven cards."); return combinations(cards, 5).map(evaluateFive).reduce((best, current) => compareHands(current, best) > 0 ? current : best); }
export function winners(players: ReadonlyArray<{ playerId: string; cards: Card[] }>, board: Card[]): string[] { const scored = players.map(player => ({ playerId: player.playerId, hand: evaluate([...player.cards, ...board] ) })); const best = scored.reduce((a, b) => compareHands(b.hand, a.hand) > 0 ? b : a); return scored.filter(player => compareHands(player.hand, best.hand) === 0).map(player => player.playerId); }
