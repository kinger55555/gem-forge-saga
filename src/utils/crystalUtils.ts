import { Crystal } from '@/types/game';

export function generateCrystal(pickaxeKey?: string): Crystal {
  let red = Math.floor(Math.random() * 256);
  let green = Math.floor(Math.random() * 256);
  let blue = Math.floor(Math.random() * 256);
  
  // Apply pickaxe-specific effects
  if (pickaxeKey) {
    ({ red, green, blue } = applyCrystalEffects(red, green, blue, pickaxeKey));
  }
  
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

export function applyCrystalEffects(red: number, green: number, blue: number, pickaxeKey: string): { red: number; green: number; blue: number } {
  switch (pickaxeKey) {
    case 'sturdy': {
      // +5% chance to get rarity ≥1 (reroll once if rarity is 0)
      let rarity = calculateRarity(red, green, blue);
      if (rarity === 0 && Math.random() < 0.05) {
        red = Math.floor(Math.random() * 256);
        green = Math.floor(Math.random() * 256);
        blue = Math.floor(Math.random() * 256);
      }
      return { red, green, blue };
    }
    
    case 'worn': {
      // Biased toward lower rarity (reduce extreme values)
      red = Math.floor(red * 0.8 + 25);
      green = Math.floor(green * 0.8 + 25);
      blue = Math.floor(blue * 0.8 + 25);
      return { red, green, blue };
    }
    
    case 'balanced': {
      // One re-roll if rarity = 0
      let rarity = calculateRarity(red, green, blue);
      if (rarity === 0) {
        red = Math.floor(Math.random() * 256);
        green = Math.floor(Math.random() * 256);
        blue = Math.floor(Math.random() * 256);
      }
      return { red, green, blue };
    }
    
    case 'rusty': {
      // Biased toward low RGB values
      red = Math.floor(red * 0.6);
      green = Math.floor(green * 0.6);
      blue = Math.floor(blue * 0.6);
      return { red, green, blue };
    }
    
    case 'prismatic': {
      // Roll 3 times, keep best rarity
      let bestRed = red, bestGreen = green, bestBlue = blue;
      let bestRarity = calculateRarity(red, green, blue);
      
      for (let i = 0; i < 2; i++) {
        const newRed = Math.floor(Math.random() * 256);
        const newGreen = Math.floor(Math.random() * 256);
        const newBlue = Math.floor(Math.random() * 256);
        const newRarity = calculateRarity(newRed, newGreen, newBlue);
        
        if (newRarity > bestRarity) {
          bestRed = newRed;
          bestGreen = newGreen;
          bestBlue = newBlue;
          bestRarity = newRarity;
        }
      }
      return { red: bestRed, green: bestGreen, blue: bestBlue };
    }
    
    case 'twin': {
      // Roll twice, take higher rarity, color = average
      const red2 = Math.floor(Math.random() * 256);
      const green2 = Math.floor(Math.random() * 256);
      const blue2 = Math.floor(Math.random() * 256);
      
      const rarity1 = calculateRarity(red, green, blue);
      const rarity2 = calculateRarity(red2, green2, blue2);
      
      // Average the colors
      red = Math.floor((red + red2) / 2);
      green = Math.floor((green + green2) / 2);
      blue = Math.floor((blue + blue2) / 2);
      
      return { red, green, blue };
    }
    
    case 'lucky': {
      // +1 rarity if any channel = 0 or 255
      if (red === 0 || red === 255 || green === 0 || green === 255 || blue === 0 || blue === 255) {
        // Enhance one channel to be exactly 0 or 255
        const channel = Math.floor(Math.random() * 3);
        const value = Math.random() < 0.5 ? 0 : 255;
        if (channel === 0) red = value;
        else if (channel === 1) green = value;
        else blue = value;
      }
      return { red, green, blue };
    }
    
    case 'ancient': {
      // Roll 3 times, keep best result, then +1 rarity boost via color adjustment
      let bestRed = red, bestGreen = green, bestBlue = blue;
      let bestRarity = calculateRarity(red, green, blue);
      
      for (let i = 0; i < 2; i++) {
        const newRed = Math.floor(Math.random() * 256);
        const newGreen = Math.floor(Math.random() * 256);
        const newBlue = Math.floor(Math.random() * 256);
        const newRarity = calculateRarity(newRed, newGreen, newBlue);
        
        if (newRarity > bestRarity) {
          bestRed = newRed;
          bestGreen = newGreen;
          bestBlue = newBlue;
          bestRarity = newRarity;
        }
      }
      
      // +1 rarity boost: try to make values more extreme
      if (Math.random() < 0.5) {
        const channel = Math.floor(Math.random() * 3);
        const value = Math.random() < 0.5 ? 0 : 255;
        if (channel === 0) bestRed = value;
        else if (channel === 1) bestGreen = value;
        else bestBlue = value;
      }
      
      return { red: bestRed, green: bestGreen, blue: bestBlue };
    }
    
    case 'edgewalker': {
      // Biased toward extreme RGB edges (0/255 ±25)
      red = Math.random() < 0.5 ? 
        Math.floor(Math.random() * 32) : 
        Math.floor(Math.random() * 32) + 223;
      green = Math.random() < 0.5 ? 
        Math.floor(Math.random() * 32) : 
        Math.floor(Math.random() * 32) + 223;
      blue = Math.random() < 0.5 ? 
        Math.floor(Math.random() * 32) : 
        Math.floor(Math.random() * 32) + 223;
      return { red, green, blue };
    }
    
    case 'mythic': {
      // Guarantees rarity ≥3, strongly biased toward edges
      let attempts = 0;
      do {
        red = Math.random() < 0.7 ? 
          (Math.random() < 0.5 ? Math.floor(Math.random() * 32) : Math.floor(Math.random() * 32) + 223) :
          Math.floor(Math.random() * 256);
        green = Math.random() < 0.7 ? 
          (Math.random() < 0.5 ? Math.floor(Math.random() * 32) : Math.floor(Math.random() * 32) + 223) :
          Math.floor(Math.random() * 256);
        blue = Math.random() < 0.7 ? 
          (Math.random() < 0.5 ? Math.floor(Math.random() * 32) : Math.floor(Math.random() * 32) + 223) :
          Math.floor(Math.random() * 256);
        
        attempts++;
      } while (calculateRarity(red, green, blue) < 3 && attempts < 100);
      
      return { red, green, blue };
    }
    
    default:
      return { red, green, blue };
  }
}

export function calculateRarity(red: number, green: number, blue: number): number {
  let rarityPoints = 0;
  const values = [red, green, blue];
  
  // Check for identical values - NEW ENHANCED RULES
  const uniqueValues = new Set(values);
  if (uniqueValues.size === 1) {
    rarityPoints += 3; // All three identical
  } else if (uniqueValues.size === 2) {
    rarityPoints += 2; // Two identical values
  }
  
  // Check proximity to edges (0 or 255) - ENHANCED RULES  
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