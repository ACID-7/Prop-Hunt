export interface MapObjectDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spriteKey: string; // matches Phaser texture key
  label: string;
}

// Prop-huntable objects on the map
// These are static; server owns their positions
export const MAP_OBJECTS: MapObjectDef[] = [
  { id: "crate_1",  x: 200,  y: 150,  width: 48, height: 48, spriteKey: "crate",  label: "Crate"  },
  { id: "crate_2",  x: 400,  y: 300,  width: 48, height: 48, spriteKey: "crate",  label: "Crate"  },
  { id: "crate_3",  x: 800,  y: 500,  width: 48, height: 48, spriteKey: "crate",  label: "Crate"  },
  { id: "barrel_1", x: 300,  y: 600,  width: 40, height: 56, spriteKey: "barrel", label: "Barrel" },
  { id: "barrel_2", x: 700,  y: 200,  width: 40, height: 56, spriteKey: "barrel", label: "Barrel" },
  { id: "barrel_3", x: 1100, y: 700,  width: 40, height: 56, spriteKey: "barrel", label: "Barrel" },
  { id: "table_1",  x: 600,  y: 400,  width: 80, height: 40, spriteKey: "table",  label: "Table"  },
  { id: "table_2",  x: 1000, y: 300,  width: 80, height: 40, spriteKey: "table",  label: "Table"  },
  { id: "bush_1",   x: 150,  y: 800,  width: 56, height: 48, spriteKey: "bush",   label: "Bush"   },
  { id: "bush_2",   x: 500,  y: 900,  width: 56, height: 48, spriteKey: "bush",   label: "Bush"   },
  { id: "bush_3",   x: 950,  y: 850,  width: 56, height: 48, spriteKey: "bush",   label: "Bush"   },
  { id: "chair_1",  x: 1300, y: 400,  width: 36, height: 40, spriteKey: "chair",  label: "Chair"  },
  { id: "chair_2",  x: 1300, y: 500,  width: 36, height: 40, spriteKey: "chair",  label: "Chair"  },
  { id: "box_1",    x: 250,  y: 450,  width: 44, height: 44, spriteKey: "box",    label: "Box"    },
  { id: "box_2",    x: 1200, y: 200,  width: 44, height: 44, spriteKey: "box",    label: "Box"    },
];

