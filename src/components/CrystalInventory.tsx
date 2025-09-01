import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crystal } from '@/types/game';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';
import { Gem, Coins } from 'lucide-react';

interface CrystalInventoryProps {
  crystals: Crystal[];
  coins: number;
}

export function CrystalInventory({ crystals, coins }: CrystalInventoryProps) {
  return (
    <div className="space-y-4">
      {/* Coins Display */}
      <Card className="p-4 bg-gradient-crystal border-primary/20">
        <div className="flex items-center justify-center gap-2">
          <Coins className="w-6 h-6 text-primary" />
          <span className="text-2xl font-bold">{coins.toLocaleString()}</span>
          <span className="text-muted-foreground">монет</span>
        </div>
      </Card>

      {/* Crystal Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Gem className="w-5 h-5" />
          Коллекция кристаллов ({crystals.length})
        </h3>
        
        {crystals.length === 0 ? (
          <Card className="p-8 text-center">
            <Gem className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground">Пока нет кристаллов</p>
            <p className="text-sm text-muted-foreground/70">Начните добычу, чтобы найти первый!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {crystals.map((crystal) => (
              <Card 
                key={crystal.id} 
                className="
                  p-3 relative overflow-hidden
                  hover:shadow-crystal transition-all duration-300
                  group cursor-pointer
                "
              >
                {/* Crystal Visual */}
                <div 
                  className="
                    w-full aspect-square rounded-lg mb-2
                    border-2 border-white/20 relative
                    flex items-center justify-center
                    group-hover:scale-105 transition-transform
                  "
                  style={{ 
                    backgroundColor: crystal.color,
                    opacity: 0.8
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`
                    }}
                  />
                  <Gem className="w-6 h-6 text-white/90 relative z-10" />
                </div>

                {/* Crystal Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline"
                      className="text-xs px-1 py-0"
                      style={{ 
                        borderColor: getRarityColor(crystal.rarity),
                        color: getRarityColor(crystal.rarity)
                      }}
                    >
                      {getRarityName(crystal.rarity)}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>RGB: {crystal.red}, {crystal.green}, {crystal.blue}</div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      <span className="font-medium">{crystal.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Rarity Glow Effect */}
                {crystal.rarity > 0 && (
                  <div 
                    className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
                    style={{ 
                      background: `radial-gradient(circle, ${getRarityColor(crystal.rarity)} 0%, transparent 70%)`
                    }}
                  />
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}