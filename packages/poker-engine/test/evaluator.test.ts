import { describe, expect, it } from "vitest";
import { evaluate, parseCard, winners } from "../src/index.js";
const hand = (cards: string) => evaluate(cards.split(" ").map(parseCard));

describe("Texas Hold'em evaluator", () => {
  it("ranks a royal flush as a straight flush", () => expect(hand("As Ks Qs Js Ts").category).toBe("STRAIGHT_FLUSH"));
  it("recognizes four of a kind", () => expect(hand("Ah Ad Ac As 2d").category).toBe("FOUR_OF_A_KIND"));
  it("recognizes a full house", () => expect(hand("Kh Kd Ks 2c 2h").category).toBe("FULL_HOUSE"));
  it("recognizes an ace-low straight", () => expect(hand("As 2d 3h 4c 5s").score).toEqual([4, 5]));
  it("uses kickers to break a pair", () => expect(hand("Ah Ad Kc Qs 2h").score).toEqual([1, 14, 13, 12, 2]));
  it("uses the best five of seven cards", () => expect(hand("As Ks Qs Js Ts 2d 2c").category).toBe("STRAIGHT_FLUSH"));
  it("returns every player on a split pot", () => expect(winners([{ playerId:"a", cards:[parseCard("2c"), parseCard("3d")] }, { playerId:"b", cards:[parseCard("4c"), parseCard("5d")] }], "As Ks Qs Js Ts".split(" ").map(parseCard))).toEqual(["a", "b"]));
});
