import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';
import { Gem, Coins, ArrowUpDown } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState<'none' | 'rarity' | 'price'>('none');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (type: 'rarity' | 'price') => {
    if (sortBy === type) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortDir('desc');
    }
  };

  const sortedCrystals = [...crystals].sort((a, b) => {
    if (sortBy === 'none') return 0;
    const diff = sortBy === 'rarity' ? a.rarity - b.rarity : a.price - b.price;
    return sortDir === 'desc' ? -diff : diff;
  });

  return (
    <>
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card">
          <Coins className="w-4 h-4 text-primary" />
          <span className="font-bold text-lg">{coins.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm">{t.coins}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Gem className="w-5 h-5" />
        {t.collection} ({crystals.length})
      </h2>

      {crystals.length > 0 && (
        <div className="flex gap-2 mb-3">
          <Button
            variant={sortBy === 'rarity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('rarity')}
            className="gap-1 text-xs"
          >
            <ArrowUpDown className="w-3 h-3" />
            {language === 'ru' ? 'Редкость' : 'Rarity'}
            {sortBy === 'rarity' && (sortDir === 'desc' ? ' ↓' : ' ↑')}
          </Button>
          <Button
            variant={sortBy === 'price' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('price')}
            className="gap-1 text-xs"
          >
            <ArrowUpDown className="w-3 h-3" />
            {language === 'ru' ? 'Цена' : 'Price'}
            {sortBy === 'price' && (sortDir === 'desc' ? ' ↓' : ' ↑')}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 max-h-[600px] overflow-y-auto">
        {crystals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 whitespace-pre-line w-full">
            {t.noCrystals}
          </p>
        ) : (
          sortedCrystals.map((crystal) => (
            <div
              key={crystal.id}
              className="w-24 flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => onSellCrystal(crystal.id, crystal.price)}
            >
              {/* Crystal tile */}
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center relative border border-border/30 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: crystal.color }}
              >
                <Gem className="w-8 h-8 text-white/80 drop-shadow-md" />
                {/* Rarity badge */}
                <Badge
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0 text-white border-0 whitespace-nowrap"
                  style={{ backgroundColor: getRarityColor(crystal.rarity) }}
                >
                  {getRarityName(crystal.rarity, language)}
                </Badge>
              </div>
              {/* Info below */}
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight text-center">
                RGB: {crystal.red}, {crystal.green}, {crystal.blue}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="w-3 h-3" />
                <span>{crystal.price.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}