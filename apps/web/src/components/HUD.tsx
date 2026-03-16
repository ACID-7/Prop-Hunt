import { GameRoomState, PlayerState } from "../game/network/ColyseusClient";
import {
  PHASE_HIDING,
  PHASE_HUNTING,
  PHASE_COUNTDOWN,
  ROLE_HUNTER,
  ROLE_PROP,
  HUNTER_ATTACK_COOLDOWN,
} from "@prop-hunt/shared";

interface HUDProps {
  state: GameRoomState;
  mySessionId: string;
  attackCooldownMs: number; // ms remaining on cooldown
  isTransformed: boolean;
  onAttack: () => void;
  onTransform: () => void;
  nearbyObjectId: string | null;
}

export default function HUD({
  state,
  mySessionId,
  attackCooldownMs,
  isTransformed,
  onAttack,
  onTransform,
  nearbyObjectId,
}: HUDProps) {
  const me = Array.from(state.players.values()).find(
    (p) => (p as PlayerState).sessionId === mySessionId
  ) as PlayerState | undefined;

  if (!me) return null;

  const phase = state.phase;
  const isHunter = me.role === ROLE_HUNTER;
  const cooldownPct = Math.max(0, attackCooldownMs / HUNTER_ATTACK_COOLDOWN);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top center: phase + timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-game-panel/90 pixel-border px-6 py-2 text-center">
        <div className={`text-xs font-game mb-1 ${phase === PHASE_HIDING ? "text-game-green" : phase === PHASE_HUNTING ? "text-game-red" : "text-game-accent"}`}>
          {phase === PHASE_COUNTDOWN && "⏳ GET READY!"}
          {phase === PHASE_HIDING && "🎭 HIDING PHASE - RUN!"}
          {phase === PHASE_HUNTING && "🏹 HUNT PHASE"}
        </div>
        <div className="text-xl font-game text-white text-glow">
          {formatTime(state.timer)}
        </div>
      </div>

      {/* Top left: role badge */}
      <div
        className={`absolute top-4 left-4 bg-game-panel/90 pixel-border px-4 py-2 font-game text-xs ${
          isHunter ? "text-game-red" : "text-game-green"
        }`}
      >
        {isHunter ? "🏹 HUNTER" : "🎭 PROP"}
        {!me.isAlive && <span className="text-gray-500 ml-2">💀 DEAD</span>}
      </div>

      {/* Bottom: action buttons */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
        {isHunter && phase === PHASE_HUNTING && (
          <button
            onClick={onAttack}
            disabled={attackCooldownMs > 0}
            className="relative bg-game-red font-game text-xs text-white px-6 py-3 pixel-border disabled:opacity-50 hover:brightness-110 transition"
          >
            {/* Cooldown overlay */}
            {cooldownPct > 0 && (
              <div
                className="absolute inset-0 bg-black/60"
                style={{ width: `${cooldownPct * 100}%` }}
              />
            )}
            <span className="relative">
              ⚔️ CHECK [E]
              {attackCooldownMs > 0 && (
                <span className="ml-2 text-gray-300">
                  {(attackCooldownMs / 1000).toFixed(1)}s
                </span>
              )}
            </span>
          </button>
        )}

        {!isHunter && (phase === PHASE_HIDING || phase === PHASE_HUNTING) && (
          <button
            onClick={onTransform}
            disabled={!nearbyObjectId && !isTransformed}
            className="bg-game-blue font-game text-xs text-white px-6 py-3 pixel-border disabled:opacity-40 hover:brightness-110 transition"
          >
            {isTransformed ? "🔄 REVERT [F]" : nearbyObjectId ? "🎭 HIDE [F]" : "🎭 HIDE [F] (find object)"}
          </button>
        )}
      </div>

      {/* Alive props counter (hunter-only) */}
      {isHunter && (
        <div className="absolute top-4 right-4 bg-game-panel/90 pixel-border px-4 py-2 font-game text-xs text-game-accent">
          🎭 PROPS:{" "}
          {
            Array.from(state.players.values()).filter(
              (p) => (p as PlayerState).role === ROLE_PROP && (p as PlayerState).isAlive
            ).length
          }{" "}
          alive
        </div>
      )}
    </div>
  );
}

