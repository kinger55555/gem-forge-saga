import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pickaxe as PickaxeType } from '@/types/game';
import { Pickaxe as PickaxeIcon, Zap } from 'lucide-react';

interface PickaxeProps {
  pickaxe: PickaxeType;
  onSelect: (pickaxe: PickaxeType) => void;
  isSelected: boolean;
  disabled?: boolean;
  language?: 'en' | 'ru';
}

export function Pickaxe({ pickaxe, onSelect, isSelected, disabled, language = 'ru' }: PickaxeProps) {
  const rarity = pickaxe.type === 'legendary' ? 'legendary' : 'common';
  
  const rarityStyles = {
    common: {
      bg: 'bg-secondary',
      text: 'text-foreground',
      border: 'border-border'
    },
    legendary: {
      bg: 'bg-rarity-legendary/20',
      text: 'text-rarity-legendary',
      border: 'border-rarity-legendary/50'
    }
  };
  
  const rarityLabels = {
    common: 'Обычная',
    legendary: 'Легендарная'
  };
  
  const rarityStyle = rarityStyles[rarity];
  const isLegendary = rarity === 'legendary';
  
  return (
    <Card className={`
      relative p-4 transition-all duration-300 cursor-pointer
      ${isSelected ? 'ring-2 ring-primary shadow-glow' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-pickaxe'}
      ${rarity !== 'common' ? `${rarityStyle.bg} ${rarityStyle.border}` : ''}
    `}>
      <Button
        variant="ghost"
        className="w-full h-full p-0 hover:bg-transparent"
        onClick={() => !disabled && onSelect(pickaxe)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center gap-2 w-full">
          <div className={`
            relative p-3 rounded-lg
            ${rarity !== 'common' ? rarityStyle.bg : 'bg-secondary'}
          `}>
            <PickaxeIcon 
              className={`
                w-8 h-8 transition-colors
                ${rarity !== 'common' ? rarityStyle.text : 'text-foreground'}
              `} 
            />
            {isLegendary && (
              <Zap className="absolute -top-1 -right-1 w-4 h-4 text-rarity-legendary animate-sparkle" />
            )}
          </div>
          
          <div className="text-center">
            <h3 className="font-medium text-sm">{pickaxe.name}</h3>
            <p className={`
              text-xs 
              ${rarity !== 'common' ? rarityStyle.text : 'text-muted-foreground'}
            `}>
              {rarityLabels[rarity]}
            </p>
          </div>
          
          {pickaxe.used && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-destructive rounded-full" />
            </div>
          )}
        </div>
      </Button>
    </Card>
  );
}