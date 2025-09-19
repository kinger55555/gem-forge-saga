import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Pickaxe } from 'lucide-react';

interface ShopProps {
  coins: number;
  onBuyPickaxe: (type: 'normal' | 'legendary', price: number) => Promise<boolean>;
}

export function Shop({ coins, onBuyPickaxe }: ShopProps) {
  const handleBuyNormal = async () => {
    await onBuyPickaxe('normal', 100);
  };

  const handleBuyLegendary = async () => {
    await onBuyPickaxe('legendary', 500);
  };

  return (
    <Card className="p-6">
      <section aria-labelledby="shop-title">
        <h2 id="shop-title" className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" aria-hidden="true" />
          Shop
        </h2>
        
        <div className="space-y-4">
          <article className="flex items-center justify-between p-4 border rounded-lg" aria-label="Normal Pickaxe">
            <div className="flex items-center gap-3">
              <Pickaxe className="w-6 h-6 text-blue-500" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">Normal Pickaxe</h3>
                <p className="text-sm text-muted-foreground">Standard mining tool</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" aria-label="Price 100 coins">100 coins</Badge>
              <Button 
                onClick={handleBuyNormal}
                disabled={coins < 100}
                size="sm"
                aria-label="Buy Normal Pickaxe for 100 coins"
              >
                Buy
              </Button>
            </div>
          </article>

          <article className="flex items-center justify-between p-4 border rounded-lg" aria-label="Legendary Pickaxe">
            <div className="flex items-center gap-3">
              <Pickaxe className="w-6 h-6 text-yellow-500" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">Legendary Pickaxe</h3>
                <p className="text-sm text-muted-foreground">No common crystals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" aria-label="Price 500 coins">500 coins</Badge>
              <Button 
                onClick={handleBuyLegendary}
                disabled={coins < 500}
                size="sm"
                aria-label="Buy Legendary Pickaxe for 500 coins"
              >
                Buy
              </Button>
            </div>
          </article>
        </div>
      </section>
    </Card>
  );
}