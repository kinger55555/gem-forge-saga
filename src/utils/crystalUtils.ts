import { Crystal } from '@/types/game';

export function generateCrystal(): Crystal {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);
  
  const rarity = calculateRarity(red, green, blue);
  const basePrice = 5;
  const price = basePrice * Math.pow(10, rarity);
  
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

export function getRarityName(rarity: number): string {
  if (rarity === 0) return 'Обычный';
  if (rarity === 1) return 'Необычный';
  if (rarity === 2) return 'Редкий';
  return 'Легендарный';
}