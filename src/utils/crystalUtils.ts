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
  const maxRarity = Math.min(5, tier + 4);

  let crystal: Crystal;
  let attempts = 0;
  do {
    crystal = generateRandomCrystal();
    attempts++;
    // Safety: after 100 attempts just accept whatever we got
  } while ((crystal.rarity < minRarity || crystal.rarity > maxRarity) && attempts < 100);

  return crystal;
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
    return 5000000000;
  }
  
  if (red === 0 && green === 0 && blue === 0) {
    return 1000000000;
  }
  
  const perfectColors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255]
  ];
  
  for (const [r, g, b] of perfectColors) {
    if (red === r && green === g && blue === b) {
      return 100000000;
    }
  }
  
  const basePrice = 5;
  if (rarity >= 8) return basePrice * Math.pow(10, 8);
  if (rarity >= 6) return basePrice * Math.pow(10, rarity + 1);
  
  return basePrice * Math.pow(10, rarity);
}