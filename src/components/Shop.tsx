import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Crown, Pickaxe as PickaxeIcon } from 'lucide-react';

interface ShopProps {
  coins: number;
  onBuyPickaxe: (type: 'normal' | 'legendary', price: number) => Promise<boolean>;
}

export function Shop({ coins, onBuyPickaxe }: ShopProps) {
  const pickaxes = [
    {
      type: 'normal' as const,
      name: 'Обычная кирка',
      description: 'Стандартная кирка для добычи',
      price: 100,
      icon: PickaxeIcon,
      rarity: 'Common'
    },
    {
      type: 'legendary' as const,
      name: 'Легендарная кирка',
      description: 'Повышенный шанс редких кристаллов',
      price: 5000,
      icon: Crown,
      rarity: 'Legendary'
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Магазин кирок</h2>
        <Badge variant="outline" className="ml-auto gap-1">
          <Coins className="w-3 h-3" />
          {coins.toLocaleString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pickaxes.map((pickaxe) => {
          const Icon = pickaxe.icon;
          const canAfford = coins >= pickaxe.price;
          const isLegendary = pickaxe.type === 'legendary';
          
          return (
            <div 
              key={pickaxe.type}
              className={`
                p-4 border rounded-lg bg-gradient-to-br from-card to-card/80
                ${isLegendary ? 'border-2 border-rarity-legendary/50' : 'border-rarity-common/50'}
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isLegendary ? 'bg-rarity-legendary/20' : 'bg-rarity-common/20'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isLegendary ? 'text-rarity-legendary' : 'text-rarity-common'}`} />
                </div>
                <div className="text-center">
                  <h3 className={`font-medium ${isLegendary ? 'text-rarity-legendary' : 'text-rarity-common'}`}>
                    {pickaxe.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">{pickaxe.rarity}</p>
                  <p className="text-xs text-muted-foreground">{pickaxe.description}</p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {pickaxe.price.toLocaleString()} монет
                  </p>
                </div>
                <Button 
                  onClick={() => onBuyPickaxe(pickaxe.type, pickaxe.price)}
                  disabled={!canAfford}
                  className="w-full"
                  size="sm"
                >
                  Купить
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}