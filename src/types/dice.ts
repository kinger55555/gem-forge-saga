export type DiceFace = 'sword' | 'shield' | 'tree' | 'rot';

export interface Dice {
  id: string;
  tier: number;
  color: string; // crystal color (rgb string)
}

export interface BattleDifficulty {
  id: string;
  name: { en: string; ru: string };
  monsterDice: number[];
  reward: { coins: number };
}

export const DICE_TIERS: Record<number, DiceFace[]> = {
  1: ['sword', 'sword', 'shield', 'shield', 'tree', 'rot'],
  2: ['sword', 'sword', 'sword', 'shield', 'tree', 'rot'],
  3: ['sword', 'shield', 'shield', 'shield', 'tree', 'rot'],
  4: ['sword', 'sword', 'shield', 'shield', 'tree', 'tree'],
  5: ['sword', 'sword', 'sword', 'shield', 'shield', 'tree'],
  6: ['sword', 'sword', 'shield', 'tree', 'tree', 'tree'],
  7: ['sword', 'sword', 'sword', 'sword', 'shield', 'rot'],
  8: ['sword', 'shield', 'shield', 'shield', 'shield', 'tree'],
  9: ['sword', 'sword', 'sword', 'tree', 'tree', 'tree'],
  10: ['sword', 'sword', 'sword', 'shield', 'tree', 'tree'], // Artifact
};

export const CRYSTALS_PER_DICE = 1;

export function rollDie(tier: number): DiceFace {
  const faces = DICE_TIERS[tier];
  if (!faces) return 'rot';
  return faces[Math.floor(Math.random() * faces.length)];
}

export function getDiceFaceIcon(face: DiceFace): string {
  switch (face) {
    case 'sword': return '⚔️';
    case 'shield': return '🛡️';
    case 'tree': return '🌳';
    case 'rot': return '💀';
  }
}

export function getDiceFaceName(face: DiceFace, lang: 'en' | 'ru'): string {
  const names: Record<DiceFace, { en: string; ru: string }> = {
    sword: { en: 'Sword', ru: 'Меч' },
    shield: { en: 'Shield', ru: 'Щит' },
    tree: { en: 'Tree', ru: 'Дерево' },
    rot: { en: 'Rot', ru: 'Гниль' },
  };
  return names[face][lang];
}

export function getTierName(tier: number, lang: 'en' | 'ru'): string {
  if (tier === 10) return lang === 'ru' ? 'Артефакт' : 'Artifact';
  return `${lang === 'ru' ? 'Тир' : 'Tier'} ${tier}`;
}

export const BATTLE_DIFFICULTIES: BattleDifficulty[] = [
  { id: 'easy', name: { en: 'Easy', ru: 'Лёгкий' }, monsterDice: [1, 1, 1, 2, 2], reward: { coins: 100 } },
  { id: 'medium', name: { en: 'Medium', ru: 'Средний' }, monsterDice: [2, 2, 3, 3, 4], reward: { coins: 400 } },
  { id: 'hard', name: { en: 'Hard', ru: 'Тяжёлый' }, monsterDice: [3, 4, 4, 5, 5], reward: { coins: 2000 } },
  { id: 'nightmare', name: { en: 'Nightmare', ru: 'Кошмар' }, monsterDice: [5, 6, 6, 7, 7], reward: { coins: 10000 } },
  { id: 'inferno', name: { en: 'Inferno', ru: 'Инферно' }, monsterDice: [7, 7, 8, 8, 9], reward: { coins: 50000 } },
];
