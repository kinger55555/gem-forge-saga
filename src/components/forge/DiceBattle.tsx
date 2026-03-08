import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dice, DiceFace, BATTLE_DIFFICULTIES, BattleDifficulty, rollDie, getDiceFaceIcon, DICE_TIERS, getTierName } from '@/types/dice';
import { DiceInventory } from './DiceInventory';
import { Swords, Heart, ArrowLeft } from 'lucide-react';

interface DiceBattleProps {
  dice: Dice[];
  onBattleEnd: (won: boolean, diceUsed: string[], coinsWon: number) => void;
  language: 'en' | 'ru';
}

type Phase = 'select-deck' | 'select-difficulty' | 'rolling' | 'result-round' | 'game-over';

interface BonusRoll {
  tier: number;
  face: DiceFace;
}

interface RolledDie {
  tier: number;
  color: string;
  face: DiceFace;
  alive: boolean;
  isArtifact: boolean;
  bonusChain: BonusRoll[]; // recursive tree bonuses
}

interface BattleState {
  playerHP: number;
  monsterHP: number;
  playerDice: { id: string; tier: number; color: string; alive: boolean }[];
  monsterDice: { tier: number; alive: boolean }[];
  round: number;
  playerRolled: RolledDie[];
  monsterRolled: RolledDie[];
  log: string[];
}

const t = {
  en: {
    selectDeck: 'Select 5 dice for battle',
    selectDiff: 'Choose difficulty',
    rollAll: 'Roll All Dice!',
    playerHP: 'Your HP',
    monsterHP: 'Monster HP',
    victory: '🎉 Victory!',
    defeat: '💀 Defeat!',
    reward: 'Reward',
    coins: 'coins',
    lost: 'You lost your dice...',
    back: 'Back',
    continue: 'Continue',
    nextRound: 'Next Round',
    round: 'Round',
    recommended: 'Recommended',
    needMore: 'You need at least 5 dice to battle',
  },
  ru: {
    selectDeck: 'Выбери 5 кубиков для боя',
    selectDiff: 'Выбери сложность',
    rollAll: 'Бросить все кубики!',
    playerHP: 'Твои HP',
    monsterHP: 'HP Монстра',
    victory: '🎉 Победа!',
    defeat: '💀 Поражение!',
    reward: 'Награда',
    coins: 'монет',
    lost: 'Ты потерял свои кубики...',
    back: 'Назад',
    continue: 'Продолжить',
    nextRound: 'Следующий раунд',
    round: 'Раунд',
    recommended: 'Рекомендуется',
    needMore: 'Нужно минимум 5 кубиков для боя',
  },
};

export function DiceBattle({ dice, onBattleEnd, language }: DiceBattleProps) {
  const l = t[language];
  const [phase, setPhase] = useState<Phase>('select-deck');
  const [selectedDiceIds, setSelectedDiceIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<BattleDifficulty | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [rolling, setRolling] = useState(false);

  const handleSelectDie = useCallback((die: Dice) => {
    setSelectedDiceIds(prev =>
      prev.includes(die.id) ? prev.filter(id => id !== die.id) : [...prev, die.id]
    );
  }, []);

  const startBattle = (diff: BattleDifficulty) => {
    setDifficulty(diff);
    setBattle({
      playerHP: 5,
      monsterHP: 5,
      playerDice: selectedDiceIds.map(id => {
        const d = dice.find(x => x.id === id)!;
        return { id: d.id, tier: d.tier, color: d.color, alive: true };
      }),
      monsterDice: diff.monsterDice.map(tier => ({ tier, alive: true })),
      round: 1,
      playerRolled: [],
      monsterRolled: [],
      log: [],
    });
    setPhase('rolling');
  };

  // Recursively generate bonus chain from tree rolls
  const generateBonusChain = (tier: number): BonusRoll[] => {
    if (tier <= 1) return [];
    const bonusTier = tier - 1;
    const bonusFace = rollDie(bonusTier);
    const roll: BonusRoll = { tier: bonusTier, face: bonusFace };
    if (bonusFace === 'tree') {
      return [roll, ...generateBonusChain(bonusTier)];
    }
    return [roll];
  };

  // Count swords/shields from a rolled die including all bonus chain
  const countFaces = (r: RolledDie, target: 'sword' | 'shield'): number => {
    if (!r.alive) return 0;
    let count = 0;
    // Main face: tree counts as sword
    if (target === 'sword' && (r.face === 'sword' || r.face === 'tree')) count++;
    if (target === 'shield' && r.face === 'shield') count++;
    // Bonus chain
    for (const b of r.bonusChain) {
      if (target === 'sword' && (b.face === 'sword' || b.face === 'tree')) count++;
      if (target === 'shield' && b.face === 'shield') count++;
    }
    return count;
  };

  const rollAllDice = () => {
    if (!battle || rolling) return;
    setRolling(true);

    setTimeout(() => {
      setBattle(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        next.log = [];

        const pRolled: RolledDie[] = prev.playerDice.map(d => {
          if (!d.alive) return { tier: d.tier, color: d.color, face: 'rot' as DiceFace, alive: false, isArtifact: false, bonusChain: [] };
          const face = rollDie(d.tier);
          const isArtifact = d.tier === 10;
          const bonusChain = face === 'tree' ? generateBonusChain(d.tier) : [];
          return { tier: d.tier, color: d.color, face, alive: true, isArtifact, bonusChain };
        });

        const mRolled: RolledDie[] = prev.monsterDice.map(d => {
          if (!d.alive) return { tier: d.tier, color: '#666', face: 'rot' as DiceFace, alive: false, isArtifact: false, bonusChain: [] };
          const face = rollDie(d.tier);
          const bonusChain = face === 'tree' ? generateBonusChain(d.tier) : [];
          return { tier: d.tier, color: '#666', face, alive: true, isArtifact: false, bonusChain };
        });

        const pSwords = pRolled.reduce((s, r) => s + countFaces(r, 'sword'), 0);
        const pShields = pRolled.reduce((s, r) => s + countFaces(r, 'shield'), 0);
        const mSwords = mRolled.reduce((s, r) => s + countFaces(r, 'sword'), 0);
        const mShields = mRolled.reduce((s, r) => s + countFaces(r, 'shield'), 0);

        const playerDmgToMonster = Math.max(0, pSwords - mShields);
        const monsterDmgToPlayer = Math.max(0, mSwords - pShields);

        next.monsterHP = Math.max(0, prev.monsterHP - playerDmgToMonster);
        next.playerHP = Math.max(0, prev.playerHP - monsterDmgToPlayer);

        if (playerDmgToMonster > 0) next.log.push(`⚔️ → ${playerDmgToMonster} ${language === 'ru' ? 'урона монстру' : 'damage to monster'}`);
        if (monsterDmgToPlayer > 0) next.log.push(`⚔️ → ${monsterDmgToPlayer} ${language === 'ru' ? 'урона тебе' : 'damage to you'}`);
        if (pShields > 0 && mSwords > 0) next.log.push(`🛡️ ${Math.min(pShields, mSwords)} ${language === 'ru' ? 'заблокировано' : 'blocked'}`);
        if (mShields > 0 && pSwords > 0) next.log.push(`🛡️ ${language === 'ru' ? 'Монстр заблокировал' : 'Monster blocked'} ${Math.min(mShields, pSwords)}`);

        // Handle rot — destroy own dice
        next.playerDice = prev.playerDice.map((d, i) => {
          if (pRolled[i]?.alive && pRolled[i]?.face === 'rot') {
            next.log.push(`💀 ${language === 'ru' ? 'Кубик уничтожен гнилью!' : 'Die destroyed by rot!'}`);
            return { ...d, alive: false };
          }
          return { ...d };
        });
        next.monsterDice = prev.monsterDice.map((d, i) => {
          if (mRolled[i]?.alive && mRolled[i]?.face === 'rot') {
            next.log.push(`💀 Monster ${language === 'ru' ? 'кубик уничтожен' : 'die destroyed'}`);
            return { ...d, alive: false };
          }
          return { ...d };
        });

        // Tree bonus log
        pRolled.forEach(r => {
          if (r.alive && r.bonusChain.length > 0) {
            r.bonusChain.forEach(b => {
              next.log.push(`🌳 ${language === 'ru' ? 'Бонус' : 'Bonus'} T${b.tier}: ${getDiceFaceIcon(b.face)}`);
            });
          }
        });

        next.playerRolled = pRolled;
        next.monsterRolled = mRolled;
        next.round = prev.round + 1;

        return next;
      });
      setRolling(false);
      setPhase('result-round');
    }, 800);
  };

  const isGameOver = battle && (
    battle.playerHP <= 0 || battle.monsterHP <= 0 ||
    !battle.playerDice.some(d => d.alive) || !battle.monsterDice.some(d => d.alive)
  );
  const playerWon = battle ? (battle.monsterHP <= 0 || !battle.monsterDice.some(d => d.alive)) : false;

  // === PHASE: SELECT DECK ===
  if (phase === 'select-deck') {
    if (dice.length < 5) {
      return <p className="text-center text-muted-foreground py-8">{l.needMore}</p>;
    }
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">{l.selectDeck}</h3>
        <DiceInventory dice={dice} selectedIds={selectedDiceIds} onSelectDie={handleSelectDie} maxSelect={5} language={language} />
        {selectedDiceIds.length === 5 && (
          <Button onClick={() => setPhase('select-difficulty')} className="w-full gap-2">
            <Swords className="w-4 h-4" /> {l.continue}
          </Button>
        )}
      </div>
    );
  }

  // === PHASE: SELECT DIFFICULTY ===
  if (phase === 'select-difficulty') {
    const avgTier = selectedDiceIds.reduce((sum, id) => {
      const d = dice.find(x => x.id === id);
      return sum + (d?.tier || 1);
    }, 0) / 5;

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setPhase('select-deck')} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> {l.back}
        </Button>
        <h3 className="text-lg font-bold text-center">{l.selectDiff}</h3>
        <div className="space-y-2">
          {BATTLE_DIFFICULTIES.map(diff => {
            const avgM = diff.monsterDice.reduce((a, b) => a + b, 0) / diff.monsterDice.length;
            const isRec = Math.abs(avgTier - avgM) <= 1.5;
            return (
              <Card key={diff.id} className="p-4 cursor-pointer hover:scale-[1.02] transition-all" onClick={() => startBattle(diff)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{diff.name[language]}</p>
                    <p className="text-xs text-muted-foreground">
                      Monster: {diff.monsterDice.map(t => `T${t}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRec && <Badge variant="secondary" className="text-xs">{l.recommended}</Badge>}
                    <Badge>💰 {diff.reward.coins.toLocaleString()}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // === PHASE: ROLLING / RESULT-ROUND ===
  if ((phase === 'rolling' || phase === 'result-round') && battle) {
    if (isGameOver) {
      return (
        <div className="space-y-6 text-center py-8 animate-fade-in">
          <h2 className="text-3xl font-bold">{playerWon ? l.victory : l.defeat}</h2>
          {playerWon && difficulty && (
            <p className="text-lg">{l.reward}: <span className="font-bold text-primary">💰 {difficulty.reward.coins.toLocaleString()} {l.coins}</span></p>
          )}
          {!playerWon && <p className="text-muted-foreground">{l.lost}</p>}
          <Button onClick={() => {
            onBattleEnd(playerWon, selectedDiceIds, playerWon && difficulty ? difficulty.reward.coins : 0);
            setPhase('select-deck');
            setSelectedDiceIds([]);
            setBattle(null);
            setDifficulty(null);
          }}>
            {l.continue}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-fade-in">
        {/* HP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{l.playerHP}: {battle.playerHP}/5</span>
            </div>
            <Progress value={(battle.playerHP / 5) * 100} className="h-3" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold">{l.monsterHP}: {battle.monsterHP}/5</span>
            </div>
            <Progress value={(battle.monsterHP / 5) * 100} className="h-3" />
          </div>
        </div>

        <p className="text-center text-sm font-semibold">{l.round} {battle.round}</p>

        {/* Rolled results */}
        {phase === 'result-round' && battle.playerRolled.length > 0 && (
          <div className="space-y-3 animate-scale-in">
            {/* Player rolled */}
            <div className="grid grid-cols-5 gap-2">
              {battle.playerRolled.map((r, i) => (
                <Card key={i} className={`p-2 text-center ${!r.alive ? 'opacity-30' : ''} ${r.isArtifact && r.face === 'tree' ? 'animate-pulse ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30' : ''}`}>
                  <div
                    className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xl shadow-md"
                    style={{ backgroundColor: r.alive ? r.color : 'hsl(var(--muted))' }}
                  >
                    {r.alive ? getDiceFaceIcon(r.face) : '✕'}
                  </div>
                  <p className="text-[10px]">T{r.tier}</p>
                </Card>
              ))}
            </div>
            {/* Player bonus dice rows (recursive chains) */}
            {(() => {
              const maxDepth = Math.max(...battle.playerRolled.map(r => r.bonusChain.length), 0);
              return Array.from({ length: maxDepth }, (_, depth) => (
                <div key={`p-bonus-${depth}`} className="grid grid-cols-5 gap-2">
                  {battle.playerRolled.map((r, i) => (
                    <div key={i} className="flex justify-center">
                      {r.alive && r.bonusChain[depth] ? (
                        <Card className="p-1.5 text-center border-dashed animate-scale-in">
                          <div
                            className="w-8 h-8 rounded-md mx-auto mb-0.5 flex items-center justify-center text-base shadow-sm opacity-80"
                            style={{ backgroundColor: r.color }}
                          >
                            {getDiceFaceIcon(r.bonusChain[depth].face)}
                          </div>
                          <p className="text-[9px] text-muted-foreground">🌳T{r.bonusChain[depth].tier}</p>
                        </Card>
                      ) : <div className="w-8" />}
                    </div>
                  ))}
                </div>
              ));
            })()}

            <p className="text-xs text-center text-muted-foreground">vs</p>

            {/* Monster rolled */}
            <div className="grid grid-cols-5 gap-2">
              {battle.monsterRolled.map((r, i) => (
                <Card key={i} className={`p-2 text-center ${!r.alive ? 'opacity-30' : ''}`}>
                  <div className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xl bg-destructive/20">
                    {r.alive ? getDiceFaceIcon(r.face) : '✕'}
                  </div>
                  <p className="text-[10px]">T{r.tier}</p>
                </Card>
              ))}
            </div>
            {/* Monster bonus dice rows (recursive chains) */}
            {(() => {
              const maxDepth = Math.max(...battle.monsterRolled.map(r => r.bonusChain.length), 0);
              return Array.from({ length: maxDepth }, (_, depth) => (
                <div key={`m-bonus-${depth}`} className="grid grid-cols-5 gap-2">
                  {battle.monsterRolled.map((r, i) => (
                    <div key={i} className="flex justify-center">
                      {r.alive && r.bonusChain[depth] ? (
                        <Card className="p-1.5 text-center border-dashed animate-scale-in">
                          <div className="w-8 h-8 rounded-md mx-auto mb-0.5 flex items-center justify-center text-base bg-destructive/15">
                            {getDiceFaceIcon(r.bonusChain[depth].face)}
                          </div>
                          <p className="text-[9px] text-muted-foreground">🌳T{r.bonusChain[depth].tier}</p>
                        </Card>
                      ) : <div className="w-8" />}
                    </div>
                  ))}
                </div>
              ));
            })()}

            {/* Log */}
            <div className="space-y-1 text-xs border rounded-lg p-2 bg-muted/30">
              {battle.log.map((entry, i) => (
                <p key={i}>{entry}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {phase === 'rolling' && (
          <Button onClick={rollAllDice} disabled={rolling} className="w-full gap-2 text-lg py-6">
            {rolling ? '🎲...' : l.rollAll}
          </Button>
        )}
        {phase === 'result-round' && !isGameOver && (
          <Button onClick={() => setPhase('rolling')} className="w-full gap-2">
            {l.nextRound}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
