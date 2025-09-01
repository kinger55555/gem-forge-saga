export interface Crystal {
  id: string;
  red: number;
  green: number;
  blue: number;
  rarity: number;
  price: number;
  color: string;
}

export interface Pickaxe {
  id: string;
  type: 'normal' | 'legendary';
  name: string;
  used: boolean;
}

export enum MiningState {
  IDLE = 'idle',
  SHOWING_RARITY = 'showing_rarity',
  SHOWING_CRYSTAL = 'showing_crystal'
}

export interface GameState {
  pickaxes: Pickaxe[];
  crystals: Crystal[];
  currentPickaxe: Pickaxe | null;
  miningState: MiningState;
  currentCrystal: Crystal | null;
  coins: number;
}