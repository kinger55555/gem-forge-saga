import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';
import { Gem, Coins } from 'lucide-react';

interface CrystalInventoryProps {
  crystals: Crystal[];
  coins: number;
  onSellCrystal: (crystalId: string, price: number) => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    collection: 'Crystal Collection',
    coins: 'coins',
    noCrystals: 'You have no crystals yet.\nSelect a pickaxe and start mining!',
    sell: 'Sell',
  },
  ru: {
    collection: 'Коллекция кристаллов',
    coins: 'монет',
    noCrystals: 'У вас пока нет кристаллов.\nВыберите кирку и начните добычу!',
    sell: 'Продать',
  }
};

export function CrystalInventory({ crystals, coins, onSellCrystal, language }: CrystalInventoryProps) {
  const t = translations[language];

  return (
    <>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Gem className="w-5 h-5" />
        {t.collection}
      </h2>
      
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-5 h-5 text-yellow-500" />
        <span className="font-bold text-xl">{coins.toLocaleString()}</span>
        <span className="text-muted-foreground">{t.coins}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
        {crystals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 whitespace-pre-line col-span-2">
            {t.noCrystals}
          </p>
        ) : (
          crystals.map((crystal) => (
            <Card key={crystal.id} className="p-3 flex flex-col items-center gap-2">
              <div 
                className="w-full aspect-square rounded-lg border-2 border-border/50"
                style={{ backgroundColor: crystal.color }}
              />
              <Badge 
                style={{ backgroundColor: getRarityColor(crystal.rarity) }}
                className="text-white text-xs"
              >
                {getRarityName(crystal.rarity, language)}
              </Badge>
              <p className="text-xs text-muted-foreground">
                RGB({crystal.red}, {crystal.green}, {crystal.blue})
              </p>
              <p className="text-sm font-semibold">
                {crystal.price.toLocaleString()} {t.coins}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onSellCrystal(crystal.id, crystal.price)}
              >
                {t.sell}
              </Button>
            </Card>
          ))
        )}
      </div>
    </>
  );
}