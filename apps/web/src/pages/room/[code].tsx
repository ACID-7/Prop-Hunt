import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import * as Colyseus from "colyseus.js";
import Lobby from "../../components/Lobby";
import HUD from "../../components/HUD";
import RoundResult from "../../components/RoundResult";
import { GameRoomState, PlayerState } from "../../game/network/ColyseusClient";
import {
  PHASE_LOBBY,
  PHASE_ROUND_END,
  PHASE_HIDING,
  PHASE_HUNTING,
  PHASE_COUNTDOWN,
} from "@prop-hunt/shared";

const COLYSEUS_URL =
  process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567";

type HudSnapshot = {
  phase: string;
  timer: number;
  attackCooldownMs: number;
  isTransformed: boolean;
  nearbyObjectId: string | null;
};

export default function RoomPage() {
  const router = useRouter();
  const { code } = router.query;
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Colyseus.Room | null>(null);

  const [roomState, setRoomState] = useState<GameRoomState | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [hudSnapshot, setHudSnapshot] = useState<HudSnapshot>({
    phase: PHASE_LOBBY,
    timer: 0,
    attackCooldownMs: 0,
    isTransformed: false,
    nearbyObjectId: null,
  });
  const [gameActive, setGameActive] = useState(false);

  // Sync entire room state to React
  const syncState = useCallback((room: Colyseus.Room) => {
    const s = room.state;
    const players = new Map<string, PlayerState>();
    s.players.forEach((p: PlayerState, id: string) => {
      players.set(id, { ...p });
    });

    setRoomState({
      phase: s.phase,
      timer: s.timer,
      players,
      winnerRoles: [...s.winnerRoles],
      round: s.round,
      winReason: s.winReason,
    });

    const phase = s.phase;
    const isInGame = phase === PHASE_HIDING || phase === PHASE_HUNTING || phase === PHASE_COUNTDOWN;
    setGameActive(isInGame);
  }, []);

  useEffect(() => {
    if (!code || typeof code !== "string") return;

    const name = localStorage.getItem("playerName") ?? "Player";
    const client = new Colyseus.Client(COLYSEUS_URL);

    client
      .joinById(code, { name })
      .then((room) => {
        roomRef.current = room;
        setSessionId(room.sessionId);
        setConnected(true);

        syncState(room);

        room.onStateChange(() => syncState(room));

        room.onError((code, msg) => setError(`Error ${code}: ${msg}`));
        room.onLeave(() => {
          import("../../game/GameManager").then(({ destroyGame }) => {
            destroyGame();
          });
          router.push("/");
        });
      })
      .catch(() => {
        setError("Could not connect to room. The room may have expired.");
      });

    return () => {
      import("../../game/GameManager").then(({ destroyGame }) => {
        destroyGame();
      });
      roomRef.current?.leave();
    };
  }, [code]);

  // Launch/destroy Phaser when game becomes active
  useEffect(() => {
    if (!gameActive || !gameContainerRef.current || !roomRef.current) return;

    let mounted = true;

    (async () => {
      const { launchGame } = await import("../../game/GameManager");
      if (!mounted) return;
      launchGame(
        gameContainerRef.current!,
        roomRef.current!,
        sessionId,
        (snapshot) => setHudSnapshot(snapshot as HudSnapshot)
      );
    })();

    return () => {
      mounted = false;
      import("../../game/GameManager").then(({ destroyGame }) => {
        destroyGame();
      });
    };
  }, [gameActive, sessionId]);

  const sendReady = () => roomRef.current?.send("ready", {});
  const sendRematch = () => roomRef.current?.send("rematch", {});
  const sendAttack = () => roomRef.current?.send("attack", {});
  const sendTransform = () => {
    if (hudSnapshot.isTransformed) {
      roomRef.current?.send("transform", { objectId: null });
    } else if (hudSnapshot.nearbyObjectId) {
      roomRef.current?.send("transform", { objectId: hudSnapshot.nearbyObjectId });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="pixel-border bg-game-panel p-8 text-center">
          <p className="text-game-red font-game text-xs mb-4">⚠ {error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-game-accent text-game-bg font-game text-xs p-3 hover:brightness-110"
          >
            ← BACK TO MENU
          </button>
        </div>
      </div>
    );
  }

  if (!connected || !roomState) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <p className="text-game-accent font-game text-xs animate-pulse">
          CONNECTING...
        </p>
      </div>
    );
  }

  const phase = roomState.phase;
  const showLobby = phase === PHASE_LOBBY || phase === PHASE_ROUND_END;
  const showGame = phase === PHASE_HIDING || phase === PHASE_HUNTING || phase === PHASE_COUNTDOWN;
  const showResult = phase === PHASE_ROUND_END;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-game-bg">
      {/* Phaser canvas container */}
      <div
        ref={gameContainerRef}
        className={`absolute inset-0 ${showGame ? "block" : "hidden"}`}
      />

      {/* Lobby / Round End */}
      {showLobby && (
        <Lobby
          state={roomState}
          mySessionId={sessionId}
          roomId={code as string}
          onReady={sendReady}
          onRematch={sendRematch}
        />
      )}

      {/* Round result overlay during round_end */}
      {showResult && (
        <RoundResult state={roomState} mySessionId={sessionId} />
      )}

      {/* In-game HUD overlay */}
      {showGame && (
        <HUD
          state={roomState}
          mySessionId={sessionId}
          attackCooldownMs={hudSnapshot.attackCooldownMs}
          isTransformed={hudSnapshot.isTransformed}
          onAttack={sendAttack}
          onTransform={sendTransform}
          nearbyObjectId={hudSnapshot.nearbyObjectId}
        />
      )}
    </div>
  );
}

