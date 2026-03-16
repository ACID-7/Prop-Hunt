import {
  Schema,
  type,
  MapSchema,
  ArraySchema,
} from "@colyseus/schema";
import {
  ROLE_PROP,
  ROLE_HUNTER,
  PHASE_LOBBY,
} from "@prop-hunt/shared";

export class PlayerState extends Schema {
  @type("string") sessionId: string = "";
  @type("string") name: string = "Player";
  @type("number") x: number = 400;
  @type("number") y: number = 300;
  @type("string") role: typeof ROLE_PROP | typeof ROLE_HUNTER = ROLE_PROP;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isAlive: boolean = true;
  @type("boolean") isTransformed: boolean = false;
  @type("string") transformedObjectId: string = ""; // empty = not transformed
  @type("number") score: number = 0;
  @type("number") lastAttackTime: number = 0; // server timestamp
}

export class GameRoomState extends Schema {
  @type("string") phase: string = PHASE_LOBBY;
  @type("number") timer: number = 0; // seconds remaining
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type(["string"]) winnerRoles = new ArraySchema<string>();
  @type("number") round: number = 0;
  @type("string") winReason: string = "";
}

