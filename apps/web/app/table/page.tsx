"use client";

import { useEffect, useMemo, useState } from "react";

type Suit = "♠" | "♥" | "♦" | "♣";

type Card = {
  rank: string;
  suit: Suit;
  red: boolean;
};

type Player = {
  name: string;
  chips: number;
  holeCards: Card[];
  folded: boolean;
};

type Stage = "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";

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
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function CardView({
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
        flexShrink: 0,
      }}
    >
      <div>{card.rank}</div>
      <div>{card.suit}</div>
    </div>
  );
}

function CardBack({ small = false }: { small?: boolean }) {
  return (
    <div
      style={{
        width: small ? "48px" : "62px",
        height: small ? "68px" : "88px",
        borderRadius: "7px",
        background:
          "repeating-linear-gradient(45deg,#172e63,#172e63 5px,#203b78 5px,#203b78 10px)",
        border: "2px solid #ddd",
        boxSizing: "border-box",
        boxShadow: "0 5px 12px rgba(0,0,0,.35)",
      }}
    />
  );
}

function PlayerBox({
  player,
  active,
  position,
}: {
  player: Player;
  active: boolean;
  position: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...position,
        minWidth: "130px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: active ? "#173d33" : "#102d26",
        border: active ? "2px solid #e9b949" : "1px solid #31534a",
        textAlign: "center",
        boxShadow: "0 6px 15px rgba(0,0,0,.25)",
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "16px",
        }}
      >
        {player.name}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#e9b949",
          fontSize: "14px",
        }}
      >
        {player.chips} chips
      </div>

      {player.name !== "You" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "5px",
            marginTop: "8px",
          }}
        >
          {player.holeCards.length === 2 && (
            <>
              <CardBack small />
              <CardBack small />
            </>
          )}
        </div>
      )}

      {player.folded && (
        <div
          style={{
            marginTop: "5px",
            color: "#d66",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          FOLDED
        </div>
      )}
    </div>
  );
}

export default function PokerTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [stage, setStage] = useState<Stage>("PREFLOP");
  const [currentPlayer, setCurrentPlayer] = useState(0);

  const [pot, setPot] = useState(30);
  const [message, setMessage] = useState("Your turn");
  const [handNumber, setHandNumber] = useState(1);

  const [userMoney, setUserMoney] = useState(1000);
  const [bet, setBet] = useState(20);
  const [roundActions, setRoundActions] = useState(0);

  const activePlayers = useMemo(
    () => players.filter((p) => !p.folded),
    [players]
  );

  function startNewHand(customMoney?: number) {
    const money = customMoney ?? userMoney;

    let newDeck = shuffle(createDeck());

    const newPlayers: Player[] = [
      {
        name: "Mike",
        chips: 1000,
        holeCards: [],
        folded: false,
      },
      {
        name: "John",
        chips: 1000,
        holeCards: [],
        folded: false,
      },
      {
        name: "You",
        chips: money,
        holeCards: [],
        folded: false,
      },
    ];

    // בדיוק 2 קלפים לכל שחקן
    for (let i = 0; i < 2; i++) {
      for (let p = 0; p < newPlayers.length; p++) {
        newPlayers[p].holeCards.push(newDeck.pop()!);
      }
    }

    // בליינדים
    newPlayers[0].chips -= SMALL_BLIND;
    newPlayers[1].chips -= BIG_BLIND;

    setPlayers(newPlayers);
    setDeck(newDeck);
    setCommunityCards([]);
    setStage("PREFLOP");
    setCurrentPlayer(2);
    setPot(30);
    setBet(BIG_BLIND);
    setRoundActions(0);
    setMessage("Your turn");
  }

  useEffect(() => {
    startNewHand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishHand(text: string) {
    setStage("SHOWDOWN");
    setMessage(text);
    setCurrentPlayer(-1);
  }

  function dealNextStage() {
    let workingDeck = [...deck];

    // Burn card
    workingDeck.pop();

    if (stage === "PREFLOP") {
      // FLOP = 3 קלפים
      const flop = [
        workingDeck.pop()!,
        workingDeck.pop()!,
        workingDeck.pop()!,
      ];

      setCommunityCards(flop);
      setStage("FLOP");
      setRoundActions(0);
      setCurrentPlayer(2);
      setMessage("Your turn");
      setDeck(workingDeck);
      return;
    }

    if (stage === "FLOP") {
      // TURN = קלף אחד
      const turn = workingDeck.pop()!;

      setCommunityCards((cards) => [...cards, turn]);
      setStage("TURN");
      setRoundActions(0);
      setCurrentPlayer(2);
      setMessage("Your turn");
      setDeck(workingDeck);
      return;
    }

    if (stage === "TURN") {
      // RIVER = קלף אחד
      const river = workingDeck.pop()!;

      setCommunityCards((cards) => [...cards, river]);
      setStage("RIVER");
      setRoundActions(0);
      setCurrentPlayer(2);
      setMessage("Your turn");
      setDeck(workingDeck);
      return;
    }

    if (stage === "RIVER") {
      finishHand("Showdown!");
    }
  }

  function nextPlayer() {
    let next = (currentPlayer + 1) % players.length;

    let safety = 0;

    while (players[next]?.folded && safety < 10) {
      next = (next + 1) % players.length;
      safety++;
    }

    setCurrentPlayer(next);
  }

  function playerAction(action: "Fold" | "Check" | "Call" | "Raise") {
    if (currentPlayer !== 2 || stage === "SHOWDOWN") {
      return;
    }

    if (action === "Fold") {
      setPlayers((old) =>
        old.map((p, i) =>
          i === 2
            ? {
                ...p,
                folded: true,
              }
            : p
        )
      );

      finishHand("You folded");
      return;
    }

    let amount = 0;

    if (action === "Call") {
      amount = 20;
      setMessage("You called");
    }

    if (action === "Raise") {
      amount = 50;
      setMessage("You raised");
    }

    if (action === "Check") {
      amount = 0;
      setMessage("You checked");
    }

    if (amount > 0) {
      setUserMoney((value) => Math.max(0, value - amount));

      setPlayers((old) =>
        old.map((p, i) =>
          i === 2
            ? {
                ...p,
                chips: Math.max(0, p.chips - amount),
              }
            : p
        )
      );

      setPot((value) => value + amount);
    }

    const newActions = roundActions + 1;
    setRoundActions(newActions);

    // אחרי 3 פעולות - עוברים לשלב הבא
    if (newActions >= activePlayers.length) {
      setTimeout(() => {
        dealNextStage();
      }, 600);

      return;
    }

    setTimeout(() => {
      nextPlayer();
    }, 500);
  }

  // פעולה אוטומטית של שחקני המחשב
  useEffect(() => {
    if (currentPlayer === -1) return;
    if (currentPlayer === 2) return;
    if (stage === "SHOWDOWN") return;

    const timer = setTimeout(() => {
      const computerAction =
        Math.random() < 0.75 ? "Check" : "Call";

      if (computerAction === "Call") {
        setPot((value) => value + 20);
      }

      setMessage(
        computerAction === "Call"
          ? `${players[currentPlayer]?.name} called`
          : `${players[currentPlayer]?.name} checked`
      );

      const newActions = roundActions + 1;
      setRoundActions(newActions);

      if (newActions >= activePlayers.length) {
        setTimeout(() => {
          dealNextStage();
        }, 500);
      } else {
        nextPlayer();
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [
    currentPlayer,
    stage,
    roundActions,
    activePlayers.length,
    players,
  ]);

  function resetMoney() {
    setUserMoney(1000);

    startNewHand(1000);

    setHandNumber((value) => value + 1);
    setMessage("Money reset — new hand");
  }

  function newHand() {
    startNewHand(userMoney);
    setHandNumber((value) => value + 1);
  }

  const you = players[2];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#071f1a",
        color: "#f5f0df",
        fontFamily: "Arial, sans-serif",
        padding: "25px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          maxWidth: "1200px",
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
              letterSpacing: "3px",
              color: "#e9b949",
              fontWeight: "bold",
            }}
          >
            STACKLINE
          </div>

          <h1
            style={{
              margin: "5px 0",
              fontSize: "28px",
            }}
          >
            Texas Hold&apos;em
          </h1>

          <div
            style={{
              color: "#9bb5ad",
              fontSize: "13px",
            }}
          >
            Hand #{handNumber} • {stage}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={newHand}
            style={{
              ...topButtonStyle,
              background: "#31534a",
              color: "#fff",
            }}
          >
            New Hand
          </button>

          <button
            onClick={resetMoney}
            style={{
              ...topButtonStyle,
              background: "#e9b949",
              color: "#111",
            }}
          >
            Reset Money
          </button>

          <div
            style={{
              background: "#102d26",
              border: "1px solid #31534a",
              padding: "12px 18px",
              borderRadius: "8px",
            }}
          >
            Chips: <strong>{userMoney}</strong>
          </div>
        </div>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: "650px",
            borderRadius: "45%",
            background:
              "radial-gradient(circle, #17624d 0%, #0d493b 55%, #08372e 100%)",
            border: "18px solid #4b3020",
            boxShadow:
              "0 20px 60px rgba(0,0,0,.45), inset 0 0 50px rgba(0,0,0,.3)",
            overflow: "hidden",
          }}
        >
          {/* POT */}
          <div
            style={{
              position: "absolute",
              top: "25px",
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
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
              top: "100px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
            }}
          >
            {communityCards.map((card, index) => (
              <CardView card={card} key={index} />
            ))}
          </div>

          {/* PLAYERS */}

          {players[0] && (
            <PlayerBox
              player={players[0]}
              active={currentPlayer === 0}
              position={{
                top: "185px",
                left: "55px",
              }}
            />
          )}

          {players[1] && (
            <PlayerBox
              player={players[1]}
              active={currentPlayer === 1}
              position={{
                top: "185px",
                right: "55px",
              }}
            />
          )}

          {/* YOU */}
          {you && (
            <div
              style={{
                position: "absolute",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                minWidth: "160px",
                padding: "12px",
                borderRadius: "12px",
                background: "#173d33",
                border: "2px solid #e9b949",
                textAlign: "center",
                zIndex: 10,
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
                {you.chips} chips
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {you.holeCards.map((card, index) => (
                  <CardView card={card} small key={index} />
                ))}
              </div>

              {currentPlayer === 2 && stage !== "SHOWDOWN" && (
                <div
                  style={{
                    marginTop: "7px",
                    color: "#e9b949",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  YOUR TURN
                </div>
              )}
            </div>
          )}

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

        {/* ACTION BUTTONS */}
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
            disabled={currentPlayer !== 2 || stage === "SHOWDOWN"}
            onClick={() => playerAction("Fold")}
            style={buttonStyle("#8f3d3d")}
          >
            Fold
          </button>

          <button
            disabled={currentPlayer !== 2 || stage === "SHOWDOWN"}
            onClick={() => playerAction("Check")}
            style={buttonStyle("#31534a")}
          >
            Check
          </button>

          <button
            disabled={currentPlayer !== 2 || stage === "SHOWDOWN"}
            onClick={() => playerAction("Call")}
            style={buttonStyle("#31534a")}
          >
            Call 20
          </button>

          <button
            disabled={currentPlayer !== 2 || stage === "SHOWDOWN"}
            onClick={() => playerAction("Raise")}
            style={buttonStyle("#e9b949", "#111")}
          >
            Raise 50
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "18px",
            color: "#9bb5ad",
            fontSize: "13px",
          }}
        >
          Play-money only • No deposits • No real-money gambling
        </div>
      </section>
    </main>
  );
}

const topButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "12px 15px",
  fontWeight: "bold",
  cursor: "pointer",
};

function buttonStyle(
  background: string,
  color: string = "#fff"
): React.CSSProperties {
  return {
    border: "none",
    borderRadius: "8px",
    padding: "14px 28px",
    background,
    color,
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    minWidth: "110px",
  };
}