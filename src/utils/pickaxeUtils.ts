import { Pickaxe } from '@/types/game';

export interface PickaxeDefinition {
  name: string;
  type: 'normal' | 'legendary';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  description: string;
  effect: string;
}

export const PICKAXE_DEFINITIONS: Record<string, PickaxeDefinition> = {
  // Blue (Common) - 53% total (8 types)
  plain: {
    name: 'Plain Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'A standard mining tool',
    effect: 'Standard RGB roll'
  },
  sturdy: {
    name: 'Sturdy Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Built to last',
    effect: '+5% chance to get rarity ≥1'
  },
  light: {
    name: 'Light Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Swift and nimble',
    effect: 'Faster animation, no rarity boost'
  },
  worn: {
    name: 'Worn Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Seen better days',
    effect: 'Biased slightly lower rarity'
  },
  balanced: {
    name: 'Balanced Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Perfectly weighted',
    effect: 'One re-roll if rarity = 0'
  },
  wooden: {
    name: 'Wooden Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Basic wooden tool',
    effect: 'Lowest-tier flavor pickaxe'
  },
  rusty: {
    name: 'Rusty Pickaxe',
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Oxidized and old',
    effect: 'Biased toward low RGB values'
  },
  beginner: {
    name: "Beginner's Pickaxe",
    type: 'normal',
    rarity: 'common',
    color: '#3b82f6',
    description: 'Perfect for new miners',
    effect: 'Same as Plain, for tutorial'
  },
  
  // Pink (Rare) - 27% total (4 types)
  prismatic: {
    name: 'Prismatic Pickaxe',
    type: 'normal',
    rarity: 'rare',
    color: '#ec4899',
    description: 'Splits light beautifully',
    effect: 'Roll 3 times, keep best rarity'
  },
  twin: {
    name: 'Twin Pickaxe',
    type: 'normal',
    rarity: 'rare',
    color: '#ec4899',
    description: 'Double-headed design',
    effect: 'Roll twice, average colors'
  },
  lucky: {
    name: 'Lucky Pickaxe',
    type: 'normal',
    rarity: 'rare',
    color: '#ec4899',
    description: 'Fortune favors this tool',
    effect: '+1 rarity if any channel = 0 or 255'
  },
  inverted: {
    name: 'Inverted Pickaxe',
    type: 'normal',
    rarity: 'rare',
    color: '#ec4899',
    description: 'Reveals hidden truths',
    effect: 'Reveal inverted RGB on second click'
  },
  
  // Red (Epic) - 13% total (2 types)
  ancient: {
    name: 'Ancient Pickaxe',
    type: 'normal',
    rarity: 'epic',
    color: '#ef4444',
    description: 'Forged in ancient times',
    effect: 'Roll 3 times, keep best, then +1 rarity'
  },
  edgewalker: {
    name: 'Edgewalker Pickaxe',
    type: 'normal',
    rarity: 'epic',
    color: '#ef4444',
    description: 'Walks the edge of reality',
    effect: 'Biased toward extreme RGB edges'
  },
  
  // Gold (Legendary) - 7% total (1 type)
  mythic: {
    name: 'Mythic Pickaxe',
    type: 'legendary',
    rarity: 'legendary',
    color: '#f59e0b',
    description: 'Legend made manifest',
    effect: 'Guarantees rarity ≥3, edge mastery bonus'
  }
};

export const RARITY_WEIGHTS = {
  common: 53,
  rare: 27,
  epic: 13,
  legendary: 7
};

export const PICKAXES_BY_RARITY = {
  common: ['plain', 'sturdy', 'light', 'worn', 'balanced', 'wooden', 'rusty', 'beginner'],
  rare: ['prismatic', 'twin', 'lucky', 'inverted'],
  epic: ['ancient', 'edgewalker'],
  legendary: ['mythic']
};

// Seeded RNG using Mulberry32
export function createSeededRandom(seed: number) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function rollPickaxeFromCase(seed?: number): string {
  const rng = seed ? createSeededRandom(seed) : Math.random;
  const roll = rng() * 100;
  
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll <= cumulative) {
      const pickaxes = PICKAXES_BY_RARITY[rarity as keyof typeof PICKAXES_BY_RARITY];
      const pickaxeIndex = Math.floor(rng() * pickaxes.length);
      return pickaxes[pickaxeIndex];
    }
  }
  
  // Fallback to common
  const common = PICKAXES_BY_RARITY.common;
  return common[Math.floor(rng() * common.length)];
}

export function generatePickaxeReelData(count: number = 50, seed?: number): string[] {
  const rng = seed ? createSeededRandom(seed) : Math.random;
  const reel: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const roll = rng() * 100;
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      cumulative += weight;
      if (roll <= cumulative) {
        const pickaxes = PICKAXES_BY_RARITY[rarity as keyof typeof PICKAXES_BY_RARITY];
        const pickaxeIndex = Math.floor(rng() * pickaxes.length);
        reel.push(pickaxes[pickaxeIndex]);
        break;
      }
    }
  }
  
  return reel;
}

export function getRarityFromPickaxe(pickaxeKey: string): 'common' | 'rare' | 'epic' | 'legendary' {
  const definition = PICKAXE_DEFINITIONS[pickaxeKey];
  return definition ? definition.rarity : 'common';
}

export function createPickaxeFromKey(pickaxeKey: string): { type: 'normal' | 'legendary'; name: string; used: boolean; pickaxeKey: string } {
  const definition = PICKAXE_DEFINITIONS[pickaxeKey];
  
  if (!definition) {
    // Fallback to plain pickaxe
    return {
      type: 'normal',
      name: 'Plain Pickaxe',
      used: false,
      pickaxeKey: 'plain'
    };
  }
  
  return {
    type: definition.type,
    name: definition.name,
    used: false,
    pickaxeKey
  };
}