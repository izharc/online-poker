"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Suit = "♠" | "♥" | "♦" | "♣";
type Stage = "preflop" | "flop" | "turn" | "river" | "showdown";

type Card = {
  rank: string;
  suit: Suit;
  red: boolean;
};

type Player = {
  id: string;
  name: string;
  chips: number;
  hand: Card[];
  folded: boolean;
  bet: number;
};

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const suits: Suit[] = ["♠", "♥", "♦", "♣"];

function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        rank,
        suit,
        red: suit === "♥" || suit === "♦",
      });
    }
  }

  return deck;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function makePlayers(): Player[] {
  return [
    {
      id: "you",
      name: "You",
      chips: STARTING_CHIPS,
      hand: [],
      folded: false,
      bet: 0,
    },
    {
      id: "mike",
      name: "Mike",
      chips: STARTING_CHIPS,
      hand: [],
      folded: false,
      bet: 0,
    },
    {
      id: "john",
      name: "John",
      chips: STARTING_CHIPS,
      hand: [],
      folded: false,
      bet: 0,
    },
  ];
}

export default function PokerTable() {
  const [players, setPlayers] = useState<Player[]>(makePlayers);
  const [deck, setDeck] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);

  const [currentPlayer, setCurrentPlayer] = useState("you");
  const [stage, setStage] = useState<Stage>("preflop");

  const [message, setMessage] = useState("Your turn");
  const [handNumber, setHandNumber] = useState(1);

  const [dealerIndex, setDealerIndex] = useState(0);
  const [showdownWinner, setShowdownWinner] = useState<string | null>(null);

  const you = players.find((p) => p.id === "you");

  const activePlayers = useMemo(
    () => players.filter((p) => !p.folded),
    [players]
  );

  const isYourTurn = currentPlayer === "you" && stage !== "showdown";

  /*
   * START A NEW HAND
   */
  const startNewHand = () => {
    const newDeck = shuffle(createDeck());

    const newPlayers = makePlayers();

    // Deal 2 cards to every player
    for (let i = 0; i < 2; i++) {
      for (let p = 0; p < newPlayers.length; p++) {
        newPlayers[p].hand.push(newDeck.pop()!);
      }
    }

    // Blinds
    const smallBlindPlayer =
      newPlayers[(dealerIndex + 1) % newPlayers.length];

    const bigBlindPlayer =
      newPlayers[(dealerIndex + 2) % newPlayers.length];

    smallBlindPlayer.chips -= SMALL_BLIND;
    smallBlindPlayer.bet = SMALL_BLIND;

    bigBlindPlayer.chips -= BIG_BLIND;
    bigBlindPlayer.bet = BIG_BLIND;

    setPlayers(newPlayers);
    setDeck(newDeck);
    setCommunityCards([]);
    setPot(SMALL_BLIND + BIG_BLIND);
    setStage("preflop");

    // First player after big blind
    setCurrentPlayer("you");
    setMessage("Your turn");
    setShowdownWinner(null);
  };

  /*
   * FIRST HAND
   */
  useEffect(() => {
    startNewHand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * FIND NEXT ACTIVE PLAYER
   */
  const getNextPlayer = (currentId: string, list: Player[]) => {
    const currentIndex = list.findIndex((p) => p.id === currentId);

    for (let i = 1; i <= list.length; i++) {
      const index = (currentIndex + i) % list.length;

      if (!list[index].folded) {
        return list[index].id;
      }
    }

    return null;
  };

  /*
   * DEAL NEXT STREET
   */
  const dealNextStreet = (currentDeck: Card[], currentPlayers: Player[]) => {
    const nextDeck = [...currentDeck];
    const nextCommunity = [...communityCards];

    if (stage === "preflop") {
      nextCommunity.push(
        nextDeck.pop()!,
        nextDeck.pop()!,
        nextDeck.pop()!
      );

      setStage("flop");
      setMessage("Flop dealt");
    } else if (stage === "flop") {
      nextCommunity.push(nextDeck.pop()!);

      setStage("turn");
      setMessage("Turn dealt");
    } else if (stage === "turn") {
      nextCommunity.push(nextDeck.pop()!);

      setStage("river");
      setMessage("River dealt");
    }

    setCommunityCards(nextCommunity);
    setDeck(nextDeck);

    const resetPlayers = currentPlayers.map((player) => ({
      ...player,
      bet: 0,
    }));

    setPlayers(resetPlayers);

    setTimeout(() => {
      const first = resetPlayers.find((p) => !p.folded);

      if (first) {
        setCurrentPlayer(first.id);
      }
    }, 400);
  };

  /*
   * SHOWDOWN
   */
  const showdown = (currentPlayers: Player[]) => {
    const available = currentPlayers.filter((p) => !p.folded);

    if (available.length === 1) {
      const winner = available[0];

      setShowdownWinner(winner.name);
      setMessage(`${winner.name} wins ${pot} chips!`);
      setStage("showdown");

      setPlayers((old) =>
        old.map((p) =>
          p.id === winner.id
            ? { ...p, chips: p.chips + pot }
            : p
        )
      );

      return;
    }

    // Simple winner selection for now.
    // Later we can replace this with a real poker hand evaluator.
    const winner =
      available[Math.floor(Math.random() * available.length)];

    setShowdownWinner(winner.name);
    setMessage(`${winner.name} wins ${pot} chips!`);
    setStage("showdown");

    setPlayers((old) =>
      old.map((p) =>
        p.id === winner.id
          ? { ...p, chips: p.chips + pot }
          : p
      )
    );
  };

  /*
   * AFTER A PLAYER ACTION
   */
  const finishAction = (
    playerId: string,
    actionName: string,
    amount: number
  ) => {
    let updatedPlayers: Player[] = [];

    setPlayers((oldPlayers) => {
      updatedPlayers = oldPlayers.map((player) => {
        if (player.id !== playerId) {
          return player;
        }

        const payment = Math.min(amount, player.chips);

        return {
          ...player,
          chips: player.chips - payment,
          bet: player.bet + payment,
        };
      });

      return updatedPlayers;
    });

    setPot((oldPot) => oldPot + amount);

    setMessage(
      playerId === "you"
        ? `You ${actionName}`
        : `${players.find((p) => p.id === playerId)?.name} ${actionName}`
    );

    // If only one player remains
    const afterFold = updatedPlayers.filter((p) => !p.folded);

    if (afterFold.length === 1) {
      showdown(updatedPlayers);
      return;
    }

    const next = getNextPlayer(playerId, updatedPlayers);

    if (!next) {
      return;
    }

    setCurrentPlayer(next);
  };

  /*
   * FOLD
   */
  const fold = () => {
    if (!isYourTurn) return;

    setPlayers((old) => {
      const updated = old.map((p) =>
        p.id === "you"
          ? { ...p, folded: true }
          : p
      );

      return updated;
    });

    setMessage("You folded");

    const remaining = players.filter((p) => p.id !== "you" && !p.folded);

    if (remaining.length === 1) {
      const winner = remaining[0];

      setPot((oldPot) => {
        setPlayers((oldPlayers) =>
          oldPlayers.map((p) =>
            p.id === winner.id
              ? { ...p, chips: p.chips + oldPot }
              : p
          )
        );

        return oldPot;
      });

      setShowdownWinner(winner.name);
      setStage("showdown");
      setMessage(`${winner.name} wins the hand`);
      return;
    }

    const next = remaining[0];

    setCurrentPlayer(next.id);
  };

  /*
   * CHECK
   */
  const check = () => {
    if (!isYourTurn) return;

    finishAction("you", "checked", 0);
  };

  /*
   * CALL
   */
  const call = () => {
    if (!isYourTurn) return;

    const amount = 20;

    if ((you?.chips ?? 0) < amount) {
      finishAction("you", "called all-in", you?.chips ?? 0);
      return;
    }

    finishAction("you", "called", amount);
  };

  /*
   * RAISE
   */
  const raise = () => {
    if (!isYourTurn) return;

    const amount = 50;

    if ((you?.chips ?? 0) < amount) {
      finishAction("you", "raised all-in", you?.chips ?? 0);
      return;
    }

    finishAction("you", "raised", amount);
  };

  /*
   * AI TURN
   */
  useEffect(() => {
    if (stage === "showdown") return;
    if (currentPlayer === "you") return;

    const timer = setTimeout(() => {
      const ai = players.find((p) => p.id === currentPlayer);

      if (!ai || ai.folded) return;

      const random = Math.random();

      if (random < 0.12) {
        // AI folds
        setPlayers((old) =>
          old.map((p) =>
            p.id === ai.id
              ? { ...p, folded: true }
              : p
          )
        );

        setMessage(`${ai.name} folded`);

        const remaining = players.filter(
          (p) => p.id !== ai.id && !p.folded
        );

        if (remaining.length === 1) {
          const winner = remaining[0];

          setPlayers((old) =>
            old.map((p) =>
              p.id === winner.id
                ? { ...p, chips: p.chips + pot }
                : p
            )
          );

          setShowdownWinner(winner.name);
          setStage("showdown");
          setMessage(`${winner.name} wins ${pot} chips!`);
          return;
        }

        const next = getNextPlayer(ai.id, players);

        if (next) {
          setCurrentPlayer(next);
        }

        return;
      }

      const amount = random < 0.65 ? 20 : 50;
      const actionName = amount === 20 ? "called" : "raised";

      setPlayers((old) =>
        old.map((p) =>
          p.id === ai.id
            ? {
                ...p,
                chips: Math.max(0, p.chips - amount),
                bet: p.bet + amount,
              }
            : p
        )
      );

      setPot((old) => old + amount);
      setMessage(`${ai.name} ${actionName}`);

      const next = getNextPlayer(ai.id, players);

      if (next) {
        setCurrentPlayer(next);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [currentPlayer, stage]);

  /*
   * MOVE TO NEXT STREET WHEN EVERYONE HAS ACTED
   *
   * For this simple version, after the action returns to
   * the first player we advance the board.
   */
  useEffect(() => {
    if (stage === "showdown") return;
    if (currentPlayer !== "you") return;

    const active = players.filter((p) => !p.folded);

    // If everybody has a bet/action, move forward.
    const allActed = active.every((p) => p.bet > 0);

    if (!allActed) return;

    const timer = setTimeout(() => {
      if (stage === "river") {
        showdown(players);
      } else {
        dealNextStreet(deck, players);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [currentPlayer, stage, players]);

  /*
   * NEW HAND
   */
  const newHand = () => {
    setDealerIndex((old) => (old + 1) % 3);

    // Small delay makes the new hand visually clear
    setTimeout(() => {
      startNewHand();
    }, 100);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#061d18",
        color: "#f5f0df",
        fontFamily: "Arial, sans-serif",
        padding: "28px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          maxWidth: "1000px",
          margin: "0 auto 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "4px",
              color: "#e9b949",
              fontWeight: "bold",
            }}
          >
            STACKLINE
          </div>

          <h1
            style={{
              margin: "5px 0 2px",
              fontSize: "28px",
            }}
          >
            Texas Hold&apos;em
          </h1>

          <div
            style={{
              color: "#91aaa3",
              fontSize: "14px",
            }}
          >
            Hand #{handNumber} • {stage.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            background: "#102d26",
            border: "1px solid #31534a",
            padding: "11px 18px",
            borderRadius: "8px",
          }}
        >
          Chips: <strong>{you?.chips ?? 0}</strong>
        </div>
      </header>

      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: "620px",
            borderRadius: "44%",
            background:
              "radial-gradient(circle, #17624d 0%, #0d493b 55%, #08372e 100%)",
            border: "16px solid #4b3020",
            boxShadow:
              "0 20px 60px rgba(0,0,0,.45), inset 0 0 50px rgba(0,0,0,.3)",
            overflow: "hidden",
          }}
        >
          {/* POT */}
          <div
            style={{
              position: "absolute",
              top: "28px",
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
              zIndex: 3,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                opacity: 0.7,
                letterSpacing: "2px",
              }}
            >
              POT
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                color: "#e9b949",
              }}
            >
              {pot}
            </div>
          </div>

          {/* COMMUNITY CARDS */}
          <div
            style={{
              position: "absolute",
              top: "88px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "9px",
              zIndex: 2,
            }}
          >
            {communityCards.map((card, index) => (
              <PlayingCard card={card} key={index} />
            ))}
          </div>

          {/* PLAYERS */}
          <PlayerBox
            player={players.find((p) => p.id === "mike")!}
            position={{
              left: "65px",
              top: "205px",
            }}
            active={currentPlayer === "mike"}
          />

          <PlayerBox
            player={players.find((p) => p.id === "john")!}
            position={{
              right: "65px",
              top: "205px",
            }}
            active={currentPlayer === "john"}
          />

          {/* YOU */}
          <div
            style={{
              position: "absolute",
              bottom: "45px",
              left: "50%",
              transform: "translateX(-50%)",
              minWidth: "145px",
              padding: "12px",
              borderRadius: "12px",
              background: "#173d33",
              border:
                currentPlayer === "you"
                  ? "2px solid #e9b949"
                  : "1px solid #31534a",
              textAlign: "center",
              boxShadow:
                currentPlayer === "you"
                  ? "0 0 25px rgba(233,185,73,.25)"
                  : "0 6px 15px rgba(0,0,0,.25)",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "17px",
              }}
            >
              You
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#e9b949",
              }}
            >
              {you?.chips ?? 0} chips
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "7px",
                marginTop: "9px",
              }}
            >
              {you?.hand.map((card, index) => (
                <PlayingCard
                  card={card}
                  key={index}
                  small
                />
              ))}
            </div>

            {currentPlayer === "you" && stage !== "showdown" && (
              <div
                style={{
                  marginTop: "6px",
                  color: "#e9b949",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                YOUR TURN
              </div>
            )}
          </div>

          {/* MESSAGE */}
          <div
            style={{
              position: "absolute",
              bottom: "175px",
              left: "50%",
              transform: "translateX(-50%)",
              fontWeight: "bold",
              fontSize: "17px",
              whiteSpace: "nowrap",
            }}
          >
            {message}
          </div>
        </div>

        {/* ACTIONS */}
        {stage !== "showdown" ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "22px",
              flexWrap: "wrap",
            }}
          >
            <button
              disabled={!isYourTurn}
              onClick={fold}
              style={buttonStyle(
                "#8f3d3d",
                "#fff",
                !isYourTurn
              )}
            >
              Fold
            </button>

            <button
              disabled={!isYourTurn}
              onClick={check}
              style={buttonStyle(
                "#31534a",
                "#fff",
                !isYourTurn
              )}
            >
              Check
            </button>

            <button
              disabled={!isYourTurn}
              onClick={call}
              style={buttonStyle(
                "#31534a",
                "#fff",
                !isYourTurn
              )}
            >
              Call 20
            </button>

            <button
              disabled={!isYourTurn}
              onClick={raise}
              style={buttonStyle(
                "#e9b949",
                "#111",
                !isYourTurn
              )}
            >
              Raise 50
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "22px",
            }}
          >
            <button
              onClick={() => {
                setHandNumber((n) => n + 1);
                newHand();
              }}
              style={buttonStyle("#e9b949", "#111", false)}
            >
              New Hand
            </button>
          </div>
        )}

        {/* STATUS */}
        <div
          style={{
            textAlign: "center",
            marginTop: "18px",
            color: "#9bb5ad",
            fontSize: "14px",
          }}
        >
          {stage === "showdown"
            ? `${showdownWinner} won the hand`
            : currentPlayer === "you"
            ? "Your turn to act"
            : `${
                players.find((p) => p.id === currentPlayer)?.name
              } is thinking...`}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "12px",
            color: "#728f87",
            fontSize: "12px",
          }}
        >
          Play-money only • No deposits • No real-money gambling
        </div>
      </section>
    </main>
  );
}

/*
 * PLAYING CARD
 */
function PlayingCard({
  card,
  small = false,
}: {
  card: Card;
  small?: boolean;
}) {
  return (
    <div
      style={{
        width: small ? "48px" : "62px",
        height: small ? "68px" : "88px",
        background: "#fff",
        borderRadius: "7px",
        color: card.red ? "#c62828" : "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: small ? "20px" : "25px",
        fontWeight: "bold",
        boxShadow: "0 5px 12px rgba(0,0,0,.35)",
      }}
    >
      <div>{card.rank}</div>
      <div>{card.suit}</div>
    </div>
  );
}

/*
 * PLAYER BOX
 */
function PlayerBox({
  player,
  position,
  active,
}: {
  player: Player;
  position: CSSProperties;
  active: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...position,
        minWidth: "125px",
        padding: "11px 14px",
        borderRadius: "12px",
        background: player.folded
          ? "#182722"
          : "#102d26",
        border: active
          ? "2px solid #e9b949"
          : "1px solid #31534a",
        textAlign: "center",
        opacity: player.folded ? 0.45 : 1,
        boxShadow: active
          ? "0 0 25px rgba(233,185,73,.25)"
          : "0 6px 15px rgba(0,0,0,.25)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "17px",
        }}
      >
        {player.name}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#e9b949",
        }}
      >
        {player.chips} chips
      </div>

      {player.folded ? (
        <div
          style={{
            marginTop: "5px",
            color: "#c76c6c",
            fontSize: "12px",
          }}
        >
          FOLDED
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "5px",
            marginTop: "8px",
          }}
        >
          <HiddenCard />
          <HiddenCard />
        </div>
      )}

      {active && !player.folded && (
        <div
          style={{
            marginTop: "5px",
            color: "#e9b949",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          THINKING...
        </div>
      )}
    </div>
  );
}

/*
 * CLOSED CARD
 */
function HiddenCard() {
  return (
    <div
      style={{
        width: "35px",
        height: "50px",
        borderRadius: "5px",
        border: "2px solid #d8e1ef",
        background:
          "repeating-linear-gradient(45deg, #162f64, #162f64 5px, #24457f 5px, #24457f 10px)",
        boxShadow: "0 3px 7px rgba(0,0,0,.3)",
      }}
    />
  );
}

/*
 * BUTTON STYLE
 */
function buttonStyle(
  background: string,
  color: string,
  disabled: boolean
): CSSProperties {
  return {
    border: "none",
    borderRadius: "8px",
    padding: "13px 27px",
    background: disabled ? "#283b36" : background,
    color: disabled ? "#71817d" : color,
    fontSize: "15px",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: "110px",
    opacity: disabled ? 0.7 : 1,
  };
}