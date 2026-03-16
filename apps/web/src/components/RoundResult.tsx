import { GameRoomState, PlayerState } from "../game/network/ColyseusClient";
import { ROLE_HUNTER, ROLE_PROP } from "@prop-hunt/shared";

interface RoundResultProps {
  state: GameRoomState;
  mySessionId: string;
}

export default function RoundResult({ state, mySessionId }: RoundResultProps) {
  const winner = state.winnerRoles.at(0);
  const players = Array.from(state.players.values()) as PlayerState[];
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="pixel-border bg-game-panel p-8 text-center max-w-md w-full mx-4">
        <h2 className="text-2xl font-game mb-2 text-game-accent text-glow">
          {winner === "hunters" ? "🏹 HUNTERS WIN!" : "🎭 PROPS WIN!"}
        </h2>
        <p className="text-xs font-game text-gray-400 mb-6">{state.winReason}</p>

        <h3 className="text-xs font-game text-gray-400 mb-3">SCOREBOARD</h3>
        <div className="space-y-2 mb-6">
          {sorted.map((p, i) => (
            <div
              key={p.sessionId}
              className={`flex justify-between items-center bg-game-bg p-3 ${
                p.sessionId === mySessionId ? "border border-game-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-game text-gray-500">#{i + 1}</span>
                <span
                  className={`text-xs font-game ${
                    p.role === ROLE_HUNTER ? "text-game-red" : "text-game-green"
                  }`}
                >
                  {p.role === ROLE_HUNTER ? "🏹" : "🎭"}
                </span>
                <span className="text-xs font-game text-white">
                  {p.name}
                  {p.sessionId === mySessionId && " ★"}
                </span>
              </div>
              <span className="text-xs font-game text-game-accent">{p.score}pt</span>
            </div>
          ))}
        </div>

        <p className="text-xs font-game text-gray-500 animate-pulse">
          Returning to lobby in {state.timer}s...
        </p>
      </div>
    </div>
  );
}

