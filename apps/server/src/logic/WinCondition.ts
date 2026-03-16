import { GameRoomState } from "../rooms/RoomState";
import { ROLE_PROP, ROLE_HUNTER } from "@prop-hunt/shared";

export function checkWinCondition(state: GameRoomState): {
  winner: "props" | "hunters" | null;
  reason: string;
} {
  const players = Array.from(state.players.values());
  const props = players.filter((p) => p.role === ROLE_PROP);
  const hunters = players.filter((p) => p.role === ROLE_HUNTER);

  if (props.length === 0) return { winner: "hunters", reason: "All props found!" };
  if (hunters.length === 0) return { winner: "props", reason: "No hunters!" };

  const aliveProps = props.filter((p) => p.isAlive);
  if (aliveProps.length === 0) {
    return { winner: "hunters", reason: "All props found!" };
  }

  return { winner: null, reason: "" };
}

