import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';
import { Gem, Coins, Share2 } from 'lucide-react';

interface CrystalInventoryProps {
  crystals: Crystal[];
  coins: number;
  onSellCrystal: (crystalId: string, price: number) => void;
  onShareCrystal?: (crystalId: string) => void;
  language: 'en' | 'ru';
}

const translations = {
  en: {
    collection: 'Crystal Collection',
    coins: 'coins',
    noCrystals: 'You have no crystals yet.\nSelect a pickaxe and start mining!',
    sell: 'Sell',
    share: 'Share'
  },
  ru: {
    collection: 'Коллекция кристаллов',
    coins: 'монет',
    noCrystals: 'У вас пока нет кристаллов.\nВыберите кирку и начните добычу!',
    sell: 'Продать',
    share: 'Поделиться'
  }
};

export function CrystalInventory({ crystals, coins, onSellCrystal, onShareCrystal, language }: CrystalInventoryProps) {
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

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {crystals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 whitespace-pre-line">
            {t.noCrystals}
          </p>
        ) : (
          crystals.map((crystal) => (
            <Card key={crystal.id} className="p-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: crystal.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      style={{ backgroundColor: getRarityColor(crystal.rarity) }}
                      className="text-white text-xs"
                    >
                      {getRarityName(crystal.rarity, language)}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {crystal.price.toLocaleString()} {t.coins}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    RGB({crystal.red}, {crystal.green}, {crystal.blue})
                  </p>
                </div>
                <div className="flex gap-2">
                  {onShareCrystal && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShareCrystal(crystal.id)}
                    >
                      <Share2 className="w-3 h-3" />
                      {t.share}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onSellCrystal(crystal.id, crystal.price)}
                  >
                    {t.sell}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}