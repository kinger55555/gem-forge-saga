import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Pickaxe as PickaxeIcon } from 'lucide-react';
import { PickaxeRarity } from '@/types/game';
import { getRarityName, getRarityColor } from '@/utils/crystalUtils';

interface ShopProps {
  coins: number;
  onBuyPickaxe: (type: PickaxeRarity, price: number) => Promise<boolean>;
  language?: 'en' | 'ru';
}

const t = {
  en: {
    title: 'Pickaxe Shop',
    rarity: 'Rarity',
    buy: 'Buy',
  },
  ru: {
    title: 'Магазин кирок',
    rarity: 'Редкость',
    buy: 'Купить',
  },
};

// Pickaxe price = crystal base price (5 * 10^tier) * 1.5, rounded up
const PICKAXE_SHOP_ITEMS: { type: PickaxeRarity; price: number; tierIndex: number }[] = [
  { type: 'trash', price: Math.ceil(5 * 1.5), tierIndex: 0 },
  { type: 'normal', price: Math.ceil(50 * 1.5), tierIndex: 1 },
  { type: 'rare', price: Math.ceil(500 * 1.5), tierIndex: 2 },
  { type: 'epic', price: Math.ceil(5000 * 1.5), tierIndex: 3 },
  { type: 'mythic', price: Math.ceil(50000 * 1.5), tierIndex: 4 },
  { type: 'legendary', price: Math.ceil(500000 * 1.5), tierIndex: 5 },
  { type: 'insane', price: Math.ceil(5000000 * 1.5), tierIndex: 6 },
  { type: 'demonic', price: Math.ceil(50000000 * 1.5), tierIndex: 7 },
  { type: 'silent', price: Math.ceil(500000000 * 1.5), tierIndex: 8 },
];

export function Shop({ coins, onBuyPickaxe, language = 'ru' }: ShopProps) {
  const l = t[language];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5" />
        <h2 className="text-xl font-semibold">{l.title}</h2>
        <Badge variant="outline" className="ml-auto gap-1">
          <Coins className="w-3 h-3" />
          {coins.toLocaleString()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PICKAXE_SHOP_ITEMS.map((item) => {
          const canAfford = coins >= item.price;
          const rarityColor = getRarityColor(item.tierIndex);
          const rarityName = getRarityName(item.tierIndex, language);

          return (
            <div
              key={item.type}
              className="p-3 border-2 rounded-lg bg-gradient-to-br from-card to-card/80 flex flex-col items-center gap-2"
              style={{ borderColor: rarityColor }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${rarityColor}20` }}
              >
                <PickaxeIcon className="w-5 h-5" style={{ color: rarityColor }} />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-sm" style={{ color: rarityColor }}>
                  {rarityName}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {l.rarity}: {Math.max(0, item.tierIndex - 1)}–{Math.min(5, item.tierIndex + 2)}
                </p>
                <p className="text-sm font-bold text-primary mt-1">
                  {item.price.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => onBuyPickaxe(item.type, item.price)}
                disabled={!canAfford}
                className="w-full"
                size="sm"
              >
                {l.buy}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
