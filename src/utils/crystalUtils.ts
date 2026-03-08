import { Crystal } from '@/types/game';

export function generateCrystal(): Crystal {
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
  if (rarity === 0) return 'hsl(var(--rarity-common))';
  if (rarity === 1) return 'hsl(var(--rarity-uncommon))';
  if (rarity === 2) return 'hsl(var(--rarity-rare))';
  return 'hsl(var(--rarity-legendary))';
}

export function getRarityName(rarity: number, language: 'en' | 'ru' = 'ru'): string {
  const names = {
    en: ['Common', 'Uncommon', 'Rare', 'Legendary'],
    ru: ['Обычный', 'Необычный', 'Редкий', 'Легендарный']
  };
  
  const index = Math.min(rarity, 3);
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