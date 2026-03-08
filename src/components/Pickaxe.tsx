import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pickaxe as PickaxeType } from '@/types/game';
import { Pickaxe as PickaxeIcon, Zap, Flame, Skull, Eye, Crown } from 'lucide-react';
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
  normal: 1,
  rare: 2,
  epic: 3,
  mythic: 4,
  legendary: 5,
  insane: 6,
  demonic: 7,
  silent: 8,
  artifact: 9,
};

export function Pickaxe({ pickaxe, onSelect, isSelected, disabled, language = 'ru' }: PickaxeProps) {
  const tier = TIER_INDEX[pickaxe.type];
  const color = getRarityColor(tier);
  const label = getRarityName(tier, language);
  const isSpecial = tier >= 3;
  const isInsane = tier === 6;
  const isDemonic = tier === 7;
  const isSilent = tier === 8;
  const isArtifact = tier === 9;
  const isHighTier = tier >= 6;

  return (
    <Card className={`
      relative p-4 transition-all duration-300 cursor-pointer overflow-hidden
      ${isSelected ? 'ring-2 ring-primary shadow-glow' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-pickaxe'}
      ${isInsane ? 'animate-[insane-shake_0.5s_ease-in-out_infinite]' : ''}
      ${isDemonic ? 'animate-[demonic-pulse_2s_ease-in-out_infinite]' : ''}
      ${isSilent ? 'animate-[silent-breathe_3s_ease-in-out_infinite]' : ''}
      ${isArtifact ? 'animate-[artifact-glow_2.5s_ease-in-out_infinite]' : ''}
    `}
      style={{ 
        borderColor: color,
        boxShadow: isHighTier ? `0 0 ${isArtifact ? '25' : '15'}px ${color}40, inset 0 0 ${isArtifact ? '20' : '10'}px ${color}10` : undefined,
      }}
    >
      {/* Background effects for high tiers */}
      {isInsane && (
        <>
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 30%, ${color}, transparent 60%)` }} />
          <div className="absolute -top-2 -right-2 w-8 h-8 opacity-30 animate-spin" style={{ color }}>
            <Zap className="w-full h-full" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 opacity-20 animate-spin" style={{ color, animationDirection: 'reverse', animationDuration: '3s' }}>
            <Zap className="w-full h-full" />
          </div>
        </>
      )}

      {isDemonic && (
        <>
          <div className="absolute inset-0 opacity-15" style={{ background: `linear-gradient(180deg, transparent 0%, ${color}30 100%)` }} />
          <div className="absolute top-1 left-1 animate-[flicker_1.5s_ease-in-out_infinite]" style={{ color }}>
            <Flame className="w-4 h-4 opacity-60" />
          </div>
          <div className="absolute top-1 right-1 animate-[flicker_1.5s_ease-in-out_infinite_0.7s]" style={{ color }}>
            <Flame className="w-4 h-4 opacity-60" />
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 animate-[flicker_2s_ease-in-out_infinite_0.3s]" style={{ color }}>
            <Flame className="w-3 h-3 opacity-40" />
          </div>
        </>
      )}

      {isSilent && (
        <>
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(ellipse at center, ${color}40, transparent 70%)` }} />
          {/* Floating particles */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-[float-particle_3s_ease-in-out_infinite]"
              style={{
                backgroundColor: color,
                opacity: 0.4,
                left: `${20 + i * 20}%`,
                bottom: '10%',
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </>
      )}

      {isArtifact && (
        <>
          <div className="absolute inset-0 opacity-20" style={{ background: `conic-gradient(from 0deg, ${color}00, ${color}60, ${color}00, ${color}60, ${color}00)` }} />
          <div className="absolute inset-0 animate-[artifact-sweep_3s_linear_infinite] opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          {/* Corner runes */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l opacity-50 animate-pulse" style={{ borderColor: color }} />
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r opacity-50 animate-pulse" style={{ borderColor: color, animationDelay: '0.5s' }} />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l opacity-50 animate-pulse" style={{ borderColor: color, animationDelay: '1s' }} />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r opacity-50 animate-pulse" style={{ borderColor: color, animationDelay: '1.5s' }} />
        </>
      )}

      <Button
        variant="ghost"
        className="w-full h-full p-0 hover:bg-transparent relative z-10"
        onClick={() => !disabled && onSelect(pickaxe)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center gap-2 w-full">
          <div
            className={`relative p-3 rounded-lg ${isArtifact ? 'animate-[artifact-icon-pulse_2s_ease-in-out_infinite]' : ''}`}
            style={{ backgroundColor: `${color}20` }}
          >
            <PickaxeIcon 
              className={`w-8 h-8 transition-colors ${isDemonic ? 'animate-[demonic-icon_2s_ease-in-out_infinite]' : ''}`} 
              style={{ color }} 
            />
            {isSpecial && !isHighTier && (
              <Zap className="absolute -top-1 -right-1 w-4 h-4 animate-sparkle" style={{ color }} />
            )}
            {isInsane && (
              <Zap className="absolute -top-1 -right-1 w-5 h-5 animate-[insane-zap_0.3s_ease-in-out_infinite]" style={{ color }} />
            )}
            {isDemonic && (
              <Skull className="absolute -top-2 -right-2 w-5 h-5 animate-pulse" style={{ color }} />
            )}
            {isSilent && (
              <Eye className="absolute -top-2 -right-2 w-5 h-5 animate-[silent-eye_3s_ease-in-out_infinite]" style={{ color }} />
            )}
            {isArtifact && (
              <Crown className="absolute -top-2 -right-1 w-5 h-5 animate-[artifact-crown_2s_ease-in-out_infinite]" style={{ color }} />
            )}
          </div>

          <div className="text-center">
            <h3 className={`font-medium text-sm ${isArtifact ? 'font-bold' : ''}`}>{pickaxe.name}</h3>
            <p className={`text-xs font-semibold ${isHighTier ? 'tracking-wider' : ''}`} style={{ color }}>{label}</p>
          </div>

          {pickaxe.used && (
            <div className="absolute top-2 right-2 z-20">
              <div className="w-2 h-2 bg-destructive rounded-full" />
            </div>
          )}
        </div>
      </Button>
    </Card>
  );
}
