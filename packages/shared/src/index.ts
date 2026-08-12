export type PlayerAction = "FOLD" | "CHECK" | "CALL" | "BET" | "RAISE" | "ALL_IN";
export type Street = "WAITING" | "STARTING" | "PRE_FLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN" | "PAYOUT";
export interface ActionRequest { tableId: string; handId: string; actionId: string; type: PlayerAction; amount?: number }
