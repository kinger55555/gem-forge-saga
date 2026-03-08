import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Crystal } from '@/types/game';
import { Dice } from '@/types/dice';
import { CrystalSmelter } from './forge/CrystalSmelter';
import { DiceInventory } from './forge/DiceInventory';
import { DiceBattle } from './forge/DiceBattle';
import { Hammer, Swords, Dices } from 'lucide-react';
import { toast } from 'sonner';

interface ForgeProps {
  crystals: Crystal[];
  coins: number;
  onConsumeCrystals: (crystalIds: string[]) => void;
  onEarnCoins: (amount: number) => void;
  language: 'en' | 'ru';
}

const t = {
  en: { smelt: 'Smelt', inventory: 'Dice', battle: 'Battle' },
  ru: { smelt: 'Плавка', inventory: 'Кубики', battle: 'Бой' },
};

const DICE_STORAGE_KEY = 'gem_forge_dice';

function loadDice(): Dice[] {
  try {
    const raw = localStorage.getItem(DICE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDice(dice: Dice[]) {
  localStorage.setItem(DICE_STORAGE_KEY, JSON.stringify(dice));
}

export function Forge({ crystals, coins, onConsumeCrystals, onEarnCoins, language }: ForgeProps) {
  const l = t[language];
  const [dice, setDice] = useState<Dice[]>(loadDice);

  useEffect(() => { saveDice(dice); }, [dice]);

  const handleSmelt = (crystalId: string, tier: number, color: string) => {
    onConsumeCrystals([crystalId]);
    const newDie: Dice = { id: crypto.randomUUID(), tier, color };
    setDice(prev => [...prev, newDie]);
    toast.success(language === 'ru'
      ? `Создан кубик ${tier === 10 ? 'Артефакт' : `Тир ${tier}`}!`
      : `Created ${tier === 10 ? 'Artifact' : `Tier ${tier}`} die!`
    );
  };

  const handleBattleEnd = (won: boolean, diceUsed: string[], coinsWon: number) => {
    if (!won) {
      setDice(prev => prev.filter(d => !diceUsed.includes(d.id)));
    }
    if (coinsWon > 0) {
      onEarnCoins(coinsWon);
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="smelt" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smelt" className="gap-1 text-xs sm:text-sm">
            <Hammer className="w-4 h-4" /> {l.smelt}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1 text-xs sm:text-sm">
            <Dices className="w-4 h-4" /> {l.inventory}
          </TabsTrigger>
          <TabsTrigger value="battle" className="gap-1 text-xs sm:text-sm">
            <Swords className="w-4 h-4" /> {l.battle}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="smelt">
          <CrystalSmelter crystals={crystals} onSmelt={handleSmelt} language={language} />
        </TabsContent>
        <TabsContent value="inventory">
          <DiceInventory dice={dice} language={language} />
        </TabsContent>
        <TabsContent value="battle">
          <DiceBattle dice={dice} onBattleEnd={handleBattleEnd} language={language} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
