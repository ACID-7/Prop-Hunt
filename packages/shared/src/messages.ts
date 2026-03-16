// Messages sent from CLIENT → SERVER
export interface C2S_Move {
  type: "move";
  vx: number; // velocity x: -1, 0, 1
  vy: number; // velocity y: -1, 0, 1
}

export interface C2S_Ready {
  type: "ready";
}

export interface C2S_Transform {
  type: "transform";
  objectId: string | null; // null = untransform
}

export interface C2S_Attack {
  type: "attack";
}

export interface C2S_Rematch {
  type: "rematch";
}

export type ClientMessage =
  | C2S_Move
  | C2S_Ready
  | C2S_Transform
  | C2S_Attack
  | C2S_Rematch;

// Messages sent from SERVER → CLIENT
export interface S2C_Error {
  type: "error";
  message: string;
}

export interface S2C_AttackResult {
  type: "attack_result";
  attackerId: string;
  targetId: string | null; // null = missed
  hit: boolean;
}

export interface S2C_TransformResult {
  type: "transform_result";
  playerId: string;
  objectId: string | null;
  success: boolean;
}

export type ServerMessage =
  | S2C_Error
  | S2C_AttackResult
  | S2C_TransformResult;
