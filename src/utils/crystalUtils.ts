import { Crystal } from '@/types/game';

export function generateCrystal(): Crystal {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);
  
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
  
  // Check for identical digits
  const uniqueValues = new Set(values);
  if (uniqueValues.size === 2) {
    rarityPoints += 2; // Two identical values
  } else if (uniqueValues.size === 1) {
    rarityPoints += 3; // Three identical values
  }
  
  // Check proximity to 0 or 255
  values.forEach(value => {
    if (value === 0 || value === 255) {
      rarityPoints += 2; // Exactly 0 or 255
    } else if (value <= 25 || value >= 230) {
      rarityPoints += 1; // Within 25 of 0 or 255
    }
  });
  
  return rarityPoints;
}

export function getRarityColor(rarity: number): string {
  if (rarity === 0) return 'hsl(var(--rarity-common))'; // Blue
  if (rarity === 1) return 'hsl(var(--rarity-uncommon))'; // Pink
  if (rarity === 2) return 'hsl(var(--rarity-rare))'; // Red
  return 'hsl(var(--rarity-legendary))'; // Yellow/Gold for 3+
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
  // Check if it's a perfect crystal (255, 255, 255)
  if (red === 255 && green === 255 && blue === 255) {
    return 5000000000; // 5 billion for perfect white crystal
  }
  
  // Check if it's a perfect black crystal (0, 0, 0)
  if (red === 0 && green === 0 && blue === 0) {
    return 1000000000; // 1 billion for perfect black crystal
  }
  
  // Check for other perfect single colors
  const perfectColors = [
    [255, 0, 0], // Pure red
    [0, 255, 0], // Pure green
    [0, 0, 255]  // Pure blue
  ];
  
  for (const [r, g, b] of perfectColors) {
    if (red === r && green === g && blue === b) {
      return 100000000; // 100 million for perfect primary colors
    }
  }
  
  // Enhanced pricing for high rarity crystals
  const basePrice = 5;
  if (rarity >= 8) return basePrice * Math.pow(10, 8); // Cap very high rarity at 500M
  if (rarity >= 6) return basePrice * Math.pow(10, rarity + 1); // Bonus for very rare
  
  return basePrice * Math.pow(10, rarity);
}