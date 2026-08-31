import { randomUUID } from "node:crypto";
import { compareHands, createDeck, evaluate, shuffle, type Card } from "@online-poker/poker-engine";

type Seat = { id: string; name: string; stack: number; cards: Card[]; folded: boolean };
export type GameState = { tableId: string; handId: string; street: "PRE_FLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN"; pot: number; communityCards: Card[]; seats: Array<{ id: string; name: string; stack: number; cards?: Card[]; folded: boolean; isYou: boolean }>; toCall: number; minRaise: number; message: string; canAct: boolean };

export class PracticeTable {
  private readonly tableId = "practice-holdem"; private handId = randomUUID(); private deck: Card[] = []; private board: Card[] = []; private seats: Seat[] = []; private pot = 0; private street: GameState["street"] = "PRE_FLOP"; private message = "New hand."; private heroId?: string;
  join(userId: string, email: string) { if (this.heroId !== userId || this.street === "SHOWDOWN") { this.heroId = userId; this.start(email.split("@")[0] || "You"); } return this.state(); }
  act(userId: string, type: "FOLD" | "CHECK" | "CALL" | "BET" | "RAISE", amount?: number) {
    if (userId !== this.heroId) throw new Error("You are not seated at this table."); const hero = this.hero(); if (!hero || this.street === "SHOWDOWN") throw new Error("Join the next hand to play."); const callAmount = Math.min(this.toCall(), hero.stack);
    if (type === "FOLD") { hero.folded = true; this.message = "You folded."; this.finishHand(); return this.state(); }
    if (type === "CHECK" && callAmount > 0) throw new Error("You need to call, raise, or fold.");
    if (type === "CALL") this.putIn(hero, callAmount);
    if (type === "BET" || type === "RAISE") { const wager = Math.max(amount ?? 0, callAmount + 20); if (wager > hero.stack) throw new Error("You do not have enough chips."); this.putIn(hero, wager); }
    this.botResponse(); this.advanceStreet(); return this.state();
  }
  private start(name: string) { this.deck = shuffle(createDeck()); this.board = []; this.pot = 0; this.street = "PRE_FLOP"; this.handId = randomUUID(); this.seats = [{ id: this.heroId!, name, stack: 1000, cards: [this.draw(), this.draw()], folded: false }, { id: "bot-ada", name: "Ada", stack: 1000, cards: [this.draw(), this.draw()], folded: false }, { id: "bot-rio", name: "Rio", stack: 1000, cards: [this.draw(), this.draw()], folded: false }]; this.putIn(this.seats[1], 10); this.putIn(this.seats[2], 20); this.message = "Pre-flop. Call 20, raise, or fold."; }
  private draw() { const card = this.deck.pop(); if (!card) throw new Error("Deck exhausted"); return card; } private hero() { return this.seats.find(seat => seat.id === this.heroId); } private toCall() { return this.street === "PRE_FLOP" ? 20 : 0; } private putIn(seat: Seat, amount: number) { const paid = Math.min(amount, seat.stack); seat.stack -= paid; this.pot += paid; }
  private botResponse() { for (const bot of this.seats.filter(seat => seat.id !== this.heroId && !seat.folded)) this.putIn(bot, Math.min(this.street === "PRE_FLOP" ? 20 : 10, bot.stack)); }
  private advanceStreet() { if (this.street === "PRE_FLOP") { this.board.push(this.draw(), this.draw(), this.draw()); this.street = "FLOP"; this.message = "Flop is out. Check or make a bet."; } else if (this.street === "FLOP") { this.board.push(this.draw()); this.street = "TURN"; this.message = "Turn card. Check or bet."; } else if (this.street === "TURN") { this.board.push(this.draw()); this.street = "RIVER"; this.message = "River card. One final decision."; } else this.finishHand(); }
  private finishHand() { this.street = "SHOWDOWN"; const contenders = this.seats.filter(seat => !seat.folded); const winner = contenders.reduce((best, seat) => compareHands(evaluate([...seat.cards, ...this.board]), evaluate([...best.cards, ...this.board])) > 0 ? seat : best); winner.stack += this.pot; this.message = `${winner.name} wins the ${this.pot} chip pot. Click Deal next hand to continue.`; }
  private state(): GameState { return { tableId: this.tableId, handId: this.handId, street: this.street, pot: this.pot, communityCards: this.board, seats: this.seats.map(seat => ({ id: seat.id, name: seat.name, stack: seat.stack, cards: seat.id === this.heroId || this.street === "SHOWDOWN" ? seat.cards : undefined, folded: seat.folded, isYou: seat.id === this.heroId })), toCall: this.toCall(), minRaise: 20, message: this.message, canAct: this.street !== "SHOWDOWN" && Boolean(this.hero() && !this.hero()!.folded) }; }
}
