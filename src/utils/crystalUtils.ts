import { Crystal, PickaxeRarity } from '@/types/game';

const PICKAXE_TIER: Record<PickaxeRarity, number> = {
  trash: 0,
  normal: 1,
  rare: 2,
  epic: 3,
  mythic: 4,
  legendary: 5,
  insane: 6,
  demonic: 7,
  silent: 8,
  artifact: 9,
};

export function generateCrystal(pickaxeType: PickaxeRarity = 'normal'): Crystal {
  const tier = PICKAXE_TIER[pickaxeType];
  const minRarity = Math.max(0, tier - 1);
  const maxRarity = Math.min(9, tier + 2);

  for (let i = 0; i < 200; i++) {
    const crystal = generateRandomCrystal();
    if (crystal.rarity >= minRarity && crystal.rarity <= maxRarity) {
      return crystal;
    }
  }

  return generateForcedCrystal(minRarity, maxRarity);
}

function generateForcedCrystal(minRarity: number, maxRarity: number): Crystal {
  // Try multiple times to get a crystal within the allowed rarity range
  for (let attempt = 0; attempt < 100; attempt++) {
    const targetRarity = minRarity + Math.floor(Math.random() * (maxRarity - minRarity + 1));

    let red: number, green: number, blue: number;

    if (targetRarity === 9) {
      // (0,0,0) or (255,255,255) → rarity 9
      const val = Math.random() > 0.5 ? 255 : 0;
      red = green = blue = val;
    } else if (targetRarity === 8) {
      // Two same extreme + one different extreme: e.g. (0,0,255) → 2+2+2+2=8
      const extremeA = Math.random() > 0.5 ? 0 : 255;
      const extremeB = extremeA === 0 ? 255 : 0;
      const channels = [extremeA, extremeA, extremeB];
      for (let j = channels.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [channels[j], channels[k]] = [channels[k], channels[j]]; }
      red = channels[0]; green = channels[1]; blue = channels[2];
    } else if (targetRarity === 7) {
      // Two same extreme + one near-extreme: e.g. (0,0,15) → 2+2+2+1=7
      const extreme = Math.random() > 0.5 ? 0 : 255;
      const nearExtreme = Math.random() > 0.5 ? Math.floor(Math.random() * 25) + 1 : 231 + Math.floor(Math.random() * 24);
      const pick = Math.floor(Math.random() * 3);
      if (pick === 0) { red = nearExtreme; green = extreme; blue = extreme; }
      else if (pick === 1) { red = extreme; green = nearExtreme; blue = extreme; }
      else { red = extreme; green = extreme; blue = nearExtreme; }
    } else if (targetRarity === 6) {
      // Three same near-extreme: e.g. (10,10,10) → 3+1+1+1=6
      const val = Math.random() > 0.5 ? Math.floor(Math.random() * 25) + 1 : 231 + Math.floor(Math.random() * 24);
      red = green = blue = val;
    } else if (targetRarity === 5) {
      // Two different extremes + one mid: e.g. (0,255,128) → 0+2+2+0=4..5
      const extreme1 = Math.random() > 0.5 ? 0 : 255;
      const extreme2 = Math.random() > 0.5 ? 0 : 255;
      const mid = 26 + Math.floor(Math.random() * 204);
      const pick = Math.floor(Math.random() * 3);
      if (pick === 0) { red = mid; green = extreme1; blue = extreme2; }
      else if (pick === 1) { red = extreme1; green = mid; blue = extreme2; }
      else { red = extreme1; green = extreme2; blue = mid; }
    } else if (targetRarity === 3) {
      const val = 30 + Math.floor(Math.random() * 196);
      red = green = blue = val;
    } else if (targetRarity === 2) {
      const val = 30 + Math.floor(Math.random() * 196);
      red = val;
      green = val;
      blue = (val + 50 + Math.floor(Math.random() * 100)) % 256;
      if (blue === val) blue = (val + 77) % 226 + 15;
    } else if (targetRarity === 1) {
      red = Math.random() > 0.5 ? Math.floor(Math.random() * 25) : 231 + Math.floor(Math.random() * 24);
      green = 30 + Math.floor(Math.random() * 196);
      blue = 30 + Math.floor(Math.random() * 196);
      if (green === red) green = (red + 50) % 196 + 30;
      if (blue === red || blue === green) blue = (red + 100) % 196 + 30;
    } else {
      red = 30 + Math.floor(Math.random() * 196);
      green = (red + 40 + Math.floor(Math.random() * 100)) % 196 + 30;
      blue = (red + 100 + Math.floor(Math.random() * 80)) % 196 + 30;
    }

    const rarity = calculateRarity(red, green, blue);
    if (rarity >= minRarity && rarity <= maxRarity) {
      const price = calculatePrice(red, green, blue, rarity);
      const color = `rgb(${red}, ${green}, ${blue})`;
      return { id: crypto.randomUUID(), red, green, blue, rarity, price, color };
    }
  }

  // Ultimate fallback: generate a simple crystal at minRarity
  const red = 30 + Math.floor(Math.random() * 196);
  const green = (red + 40 + Math.floor(Math.random() * 100)) % 196 + 30;
  const blue = (red + 100 + Math.floor(Math.random() * 80)) % 196 + 30;
  const rarity = calculateRarity(red, green, blue);
  const price = calculatePrice(red, green, blue, rarity);
  const color = `rgb(${red}, ${green}, ${blue})`;
  return { id: crypto.randomUUID(), red, green, blue, rarity, price, color };
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
    red, green, blue,
    rarity, price, color
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
  if (rarity === 1) return 'hsl(var(--rarity-normal))';
  if (rarity === 2) return 'hsl(var(--rarity-rare))';
  if (rarity === 3) return 'hsl(var(--rarity-epic))';
  if (rarity === 4) return 'hsl(var(--rarity-mythic))';
  if (rarity === 5) return 'hsl(var(--rarity-legendary))';
  if (rarity === 6) return 'hsl(var(--rarity-insane))';
  if (rarity === 7) return 'hsl(var(--rarity-demonic))';
  if (rarity === 8) return 'hsl(var(--rarity-silent))';
  return 'hsl(var(--rarity-artifact))';
}

export function getRarityName(rarity: number, language: 'en' | 'ru' = 'ru'): string {
  const names = {
    en: ['Trash', 'Normal', 'Rare', 'Epic', 'Mythic', 'Legendary', 'Insane', 'Demonic', 'Silent', 'Artifact'],
    ru: ['Мусор', 'Обычный', 'Редкий', 'Эпический', 'Мифический', 'Легендарный', 'Безумный', 'Демонический', 'Тихий', 'Артефакт']
  };
  
  const index = Math.min(rarity, 9);
  return names[language][index];
}

export function calculatePrice(red: number, green: number, blue: number, rarity: number): number {
  if (red === 255 && green === 255 && blue === 255) {
    return 500000;
  }
  
  if (red === 0 && green === 0 && blue === 0) {
    return 500000;
  }
  
  const basePrice = 5;
  return basePrice * Math.pow(10, rarity);
}
