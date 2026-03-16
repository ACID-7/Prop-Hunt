import { GameRoomState, PlayerState } from "../game/network/ColyseusClient";
import {
  ROLE_HUNTER,
  ROLE_PROP,
  PHASE_LOBBY,
  PHASE_ROUND_END,
  MIN_PLAYERS_TO_START,
} from "@prop-hunt/shared";

interface LobbyProps {
  state: GameRoomState;
  mySessionId: string;
  roomId: string;
  onReady: () => void;
  onRematch: () => void;
}

export default function Lobby({ state, mySessionId, roomId, onReady, onRematch }: LobbyProps) {
  const players = Array.from(state.players.values()) as PlayerState[];
  const me = players.find((p) => p.sessionId === mySessionId);
  const allReady = players.length >= MIN_PLAYERS_TO_START && players.every((p) => p.isReady);
  const isRoundEnd = state.phase === PHASE_ROUND_END;

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h1 className="text-game-accent text-glow text-2xl font-game mb-2">
          🕵️ PROP HUNT
        </h1>
        <div className="text-gray-400 text-xs font-game">
          ROOM CODE:{" "}
          <span className="text-game-accent text-glow">{roomId}</span>
        </div>
      </div>

      {isRoundEnd && (
        <div className="pixel-border bg-game-panel p-6 mb-8 text-center w-full max-w-md">
          <h2 className="text-xl font-game mb-2 text-game-accent">
            {state.winnerRoles.at(0) === "hunters" ? "🏹 HUNTERS WIN!" : "🎭 PROPS WIN!"}
          </h2>
          <p className="text-xs text-gray-300 font-game">{state.winReason}</p>
        </div>
      )}

      <div className="pixel-border bg-game-panel p-6 w-full max-w-md mb-6">
        <h2 className="text-xs font-game text-gray-400 mb-4">
          PLAYERS ({players.length}/{8})
        </h2>
        <div className="space-y-2">
          {players.map((p) => (
            <div
              key={p.sessionId}
              className="flex items-center justify-between bg-game-bg p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg ${p.sessionId === mySessionId ? "text-game-accent" : "text-white"}`}
                >
                  {p.sessionId === mySessionId ? "⭐" : "👤"}
                </span>
                <span className="text-xs font-game text-white">
                  {p.name}
                  {p.sessionId === mySessionId && " (you)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isRoundEnd && (
                  <span
                    className={`text-xs font-game ${
                      p.role === ROLE_HUNTER ? "text-game-red" : "text-game-green"
                    }`}
                  >
                    {p.role === ROLE_HUNTER ? "🏹" : "🎭"}{" "}
                    {p.role.toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-game text-yellow-400">
                  {p.score}pts
                </span>
                <span
                  className={`text-xs font-game ${
                    p.isReady ? "text-game-green" : "text-gray-500"
                  }`}
                >
                  {p.isReady ? "✅ READY" : "⏳ WAIT"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {players.length < MIN_PLAYERS_TO_START && (
          <p className="text-xs font-game text-gray-500 mt-4 text-center">
            Waiting for {MIN_PLAYERS_TO_START - players.length} more player(s)...
          </p>
        )}
      </div>

      <button
        onClick={isRoundEnd ? onRematch : onReady}
        className={`pixel-border font-game text-xs p-4 w-full max-w-md transition ${
          me?.isReady
            ? "bg-gray-700 text-gray-400"
            : "bg-game-accent text-game-bg hover:brightness-110"
        }`}
      >
        {isRoundEnd
          ? me?.isReady
            ? "⏳ WAITING FOR OTHERS..."
            : "🔄 REMATCH!"
          : me?.isReady
          ? "⏳ WAITING FOR OTHERS..."
          : "✅ READY UP!"}
      </button>

      <p className="text-xs font-game text-gray-600 mt-4 text-center">
        {allReady ? "🚀 Starting soon..." : "All players must ready up to start"}
      </p>
    </div>
  );
}

