import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Gem, Shield, Crown } from 'lucide-react';

interface ShopProps {
  coins: number;
  onBuySpecificPickaxe: (pickaxeKey: string, price: number) => Promise<boolean>;
}

export function Shop({ coins, onBuySpecificPickaxe }: ShopProps) {
  const pickaxes = [
    {
      key: 'plain',
      name: 'Plain Pickaxe',
      description: 'Standard mining tool',
      price: 100,
      color: 'hsl(var(--rarity-common))',
      icon: ShoppingCart,
      rarity: 'Common'
    },
    {
      key: 'prismatic', 
      name: 'Prismatic Pickaxe',
      description: 'Roll 3 times, keep best rarity',
      price: 1000,
      color: 'hsl(var(--rarity-uncommon))',
      icon: Gem,
      rarity: 'Rare'
    },
    {
      key: 'ancient',
      name: 'Ancient Pickaxe', 
      description: 'Roll 3 times, keep best, then +1 rarity',
      price: 5000,
      color: 'hsl(var(--rarity-rare))',
      icon: Crown,
      rarity: 'Epic'
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pickaxes.map((pickaxe) => {
          const Icon = pickaxe.icon;
          const canAfford = coins >= pickaxe.price;
          
          return (
            <div 
              key={pickaxe.key}
              className={`
                p-4 border rounded-lg bg-gradient-to-br from-card to-card/80
                ${pickaxe.rarity === 'Epic' ? 'border-2 border-rarity-rare/50' : ''}
                ${pickaxe.rarity === 'Rare' ? 'border-rarity-uncommon/50' : ''}
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${pickaxe.color}20` }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: pickaxe.color }}
                  />
                </div>
                <div className="text-center">
                  <h3 
                    className="font-medium"
                    style={{ color: pickaxe.color }}
                  >
                    {pickaxe.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">{pickaxe.rarity}</p>
                  <p className="text-xs text-muted-foreground">{pickaxe.description}</p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {pickaxe.price.toLocaleString()} монет
                  </p>
                </div>
                <Button 
                  onClick={() => onBuySpecificPickaxe(pickaxe.key, pickaxe.price)}
                  disabled={!canAfford}
                  className="w-full"
                  size="sm"
                  style={
                    pickaxe.rarity === 'Epic' ? {
                      backgroundColor: pickaxe.color,
                      color: 'white'
                    } : undefined
                  }
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