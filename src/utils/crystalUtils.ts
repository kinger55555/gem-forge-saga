import { Crystal, PickaxeRarity } from '@/types/game';

const PICKAXE_TIER: Record<PickaxeRarity, number> = {
  trash: 0,
  common: 1,
  epic: 2,
  legendary: 3,
  demonic: 4,
  silent: 5,
};

export function generateCrystal(pickaxeType: PickaxeRarity = 'common'): Crystal {
  const tier = PICKAXE_TIER[pickaxeType];
  const minRarity = Math.max(0, tier - 1);
  const maxRarity = Math.min(5, tier + 2);

  // Try random generation first
  for (let i = 0; i < 200; i++) {
    const crystal = generateRandomCrystal();
    if (crystal.rarity >= minRarity && crystal.rarity <= maxRarity) {
      return crystal;
    }
  }

  // If random fails, force a crystal within the required rarity range
  return generateForcedCrystal(minRarity, maxRarity);
}

function generateForcedCrystal(minRarity: number, maxRarity: number): Crystal {
  // Target a rarity in the valid range, weighted toward the lower end
  const targetRarity = minRarity + Math.floor(Math.random() * (maxRarity - minRarity + 1));

  let red: number, green: number, blue: number;

  if (targetRarity >= 5) {
    // All channels at extremes + all same → 3+6=9, capped at 5
    const val = Math.random() > 0.5 ? 255 : 0;
    red = green = blue = val;
  } else if (targetRarity === 4) {
    // Two channels at extremes + two matching = 2+4=6 → capped to 5, but aim for 4
    // Three matching + one extreme: 3+2=5. Two extremes + random: 0+4=4
    const extreme1 = Math.random() > 0.5 ? 255 : 0;
    const extreme2 = Math.random() > 0.5 ? 255 : 0;
    red = extreme1;
    green = extreme2;
    blue = 50 + Math.floor(Math.random() * 156); // safe middle value
  } else if (targetRarity === 3) {
    // All three same (non-extreme) = 3 points
    const val = 30 + Math.floor(Math.random() * 196); // avoid extremes
    red = green = blue = val;
  } else if (targetRarity === 2) {
    // Two matching (non-extreme) = 2 points
    const val = 30 + Math.floor(Math.random() * 196);
    red = val;
    green = val;
    blue = (val + 50 + Math.floor(Math.random() * 100)) % 256;
    // Make sure blue != val to avoid +3
    if (blue === val) blue = (val + 77) % 226 + 15;
  } else if (targetRarity === 1) {
    // One channel near extreme = 1 point
    red = Math.random() > 0.5 ? Math.floor(Math.random() * 25) : 231 + Math.floor(Math.random() * 24);
    green = 30 + Math.floor(Math.random() * 196);
    blue = 30 + Math.floor(Math.random() * 196);
    // Ensure all unique
    if (green === red) green = (red + 50) % 196 + 30;
    if (blue === red || blue === green) blue = (red + 100) % 196 + 30;
  } else {
    // Rarity 0: all different, all in safe middle range
    red = 30 + Math.floor(Math.random() * 196);
    green = (red + 40 + Math.floor(Math.random() * 100)) % 196 + 30;
    blue = (red + 100 + Math.floor(Math.random() * 80)) % 196 + 30;
  }

  const rarity = calculateRarity(red, green, blue);
  const price = calculatePrice(red, green, blue, rarity);
  const color = `rgb(${red}, ${green}, ${blue})`;

  return {
    id: crypto.randomUUID(),
    red, green, blue,
    rarity, price, color
  };
}

function generateRandomCrystal(): Crystal {
  let red = Math.floor(Math.random() * 256);
  let green = Math.floor(Math.random() * 256);
  let blue = Math.floor(Math.random() * 256);
  
  const rarity = calculateRarity(red, green, blue);
  const price = calculatePrice(red, green, blue, rarity);
  const color = `rgb(${red}, ${green}, ${blue})`;
  
  return {
    id: crypto.randomUUID(),
    red,
    green,
    blue,
    rarity,
    price,
    color
  };
}

export function calculateRarity(red: number, green: number, blue: number): number {
  let rarityPoints = 0;
  const values = [red, green, blue];
  
  const uniqueValues = new Set(values);
  if (uniqueValues.size === 1) {
    rarityPoints += 3;
  } else if (uniqueValues.size === 2) {
    rarityPoints += 2;
  }
  
  values.forEach(value => {
    if (value === 0 || value === 255) {
      rarityPoints += 2;
    } else if (value <= 25 || value >= 230) {
      rarityPoints += 1;
    }
  });
  
  return rarityPoints;
}

export function getRarityColor(rarity: number): string {
  if (rarity === 0) return 'hsl(var(--rarity-trash))';
  if (rarity === 1) return 'hsl(var(--rarity-common))';
  if (rarity === 2) return 'hsl(var(--rarity-epic))';
  if (rarity === 3) return 'hsl(var(--rarity-legendary))';
  if (rarity === 4) return 'hsl(var(--rarity-demonic))';
  return 'hsl(var(--rarity-silent))';
}

export function getRarityName(rarity: number, language: 'en' | 'ru' = 'ru'): string {
  const names = {
    en: ['Trash', 'Common', 'Epic', 'Legendary', 'Demonic', 'Silent'],
    ru: ['Мусор', 'Обычный', 'Эпический', 'Легендарный', 'Демонический', 'Тихий']
  };
  
  const index = Math.min(rarity, 5);
  return names[language][index];
}

export function calculatePrice(red: number, green: number, blue: number, rarity: number): number {
  if (red === 255 && green === 255 && blue === 255) {
    return 500000;
  }
  
  if (red === 0 && green === 0 && blue === 0) {
    return 500000;
  }
  
  const perfectColors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255]
  ];
  
  for (const [r, g, b] of perfectColors) {
    if (red === r && green === g && blue === b) {
      return 250000;
    }
  }
  
  const basePrice = 5;
  const cappedRarity = Math.min(rarity, 7);
  return basePrice * Math.pow(10, cappedRarity);
}