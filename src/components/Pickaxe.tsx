import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pickaxe as PickaxeType } from '@/types/game';
import { Pickaxe as PickaxeIcon, Zap } from 'lucide-react';
import { getRarityColor, getRarityName } from '@/utils/crystalUtils';

interface PickaxeProps {
  pickaxe: PickaxeType;
  onSelect: (pickaxe: PickaxeType) => void;
  isSelected: boolean;
  disabled?: boolean;
  language?: 'en' | 'ru';
}

const TIER_INDEX: Record<PickaxeType['type'], number> = {
  trash: 0,
  common: 1,
  epic: 2,
  legendary: 3,
  demonic: 4,
  silent: 5,
};

export function Pickaxe({ pickaxe, onSelect, isSelected, disabled, language = 'ru' }: PickaxeProps) {
  const tier = TIER_INDEX[pickaxe.type];
  const color = getRarityColor(tier);
  const label = getRarityName(tier, language);
  const isSpecial = tier >= 3;

  return (
    <Card className={`
      relative p-4 transition-all duration-300 cursor-pointer
      ${isSelected ? 'ring-2 ring-primary shadow-glow' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-pickaxe'}
    `}
      style={{ borderColor: color }}
    >
      <Button
        variant="ghost"
        className="w-full h-full p-0 hover:bg-transparent"
        onClick={() => !disabled && onSelect(pickaxe)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center gap-2 w-full">
          <div
            className="relative p-3 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <PickaxeIcon className="w-8 h-8 transition-colors" style={{ color }} />
            {isSpecial && (
              <Zap className="absolute -top-1 -right-1 w-4 h-4 animate-sparkle" style={{ color }} />
            )}
          </div>

          <div className="text-center">
            <h3 className="font-medium text-sm">{pickaxe.name}</h3>
            <p className="text-xs" style={{ color }}>{label}</p>
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
