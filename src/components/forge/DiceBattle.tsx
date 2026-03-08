import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dice, DiceFace, BATTLE_DIFFICULTIES, BattleDifficulty, rollDie, getDiceFaceIcon, getDiceFaceName, DICE_TIERS } from '@/types/dice';
import { DiceInventory } from './DiceInventory';
import { Swords, Heart, ArrowLeft, Dices } from 'lucide-react';

interface DiceBattleProps {
  dice: Dice[];
  onBattleEnd: (won: boolean, diceUsed: string[], coinsWon: number) => void;
  language: 'en' | 'ru';
}

type Phase = 'select-deck' | 'select-difficulty' | 'battle' | 'result';

interface BattleState {
  playerHP: number;
  monsterHP: number;
  playerDeck: { id: string; tier: number; alive: boolean }[];
  monsterDeck: { tier: number; alive: boolean }[];
  round: number;
  log: { text: string; type: 'player' | 'monster' | 'info' }[];
  playerRoll: { face: DiceFace; dieIndex: number } | null;
  monsterRoll: { face: DiceFace; dieIndex: number } | null;
  bonusRolls: { tier: number; face: DiceFace }[];
}

const t = {
  en: {
    selectDeck: 'Select 5 dice for battle',
    selectDiff: 'Choose difficulty',
    fight: 'Fight!',
    roll: 'Roll',
    yourTurn: 'Pick a die to roll',
    playerHP: 'Your HP',
    monsterHP: 'Monster HP',
    victory: '🎉 Victory!',
    defeat: '💀 Defeat!',
    reward: 'Reward',
    coins: 'coins',
    lost: 'You lost your dice...',
    back: 'Back',
    continue: 'Continue',
    round: 'Round',
    recommended: 'Recommended',
    startBattle: 'Start Battle',
    bonusRoll: 'Bonus roll!',
    dieDestroyed: 'Die destroyed by rot!',
    blocked: 'Blocked!',
    damage: 'damage!',
  },
  ru: {
    selectDeck: 'Выбери 5 кубиков для боя',
    selectDiff: 'Выбери сложность',
    fight: 'В бой!',
    roll: 'Бросить',
    yourTurn: 'Выбери кубик для броска',
    playerHP: 'Твои HP',
    monsterHP: 'HP Монстра',
    victory: '🎉 Победа!',
    defeat: '💀 Поражение!',
    reward: 'Награда',
    coins: 'монет',
    lost: 'Ты потерял свои кубики...',
    back: 'Назад',
    continue: 'Продолжить',
    round: 'Раунд',
    recommended: 'Рекомендуется',
    startBattle: 'Начать бой',
    bonusRoll: 'Бонусный бросок!',
    dieDestroyed: 'Кубик уничтожен гнилью!',
    blocked: 'Заблокировано!',
    damage: 'урон!',
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
      playerDeck: selectedDiceIds.map(id => {
        const d = dice.find(x => x.id === id)!;
        return { id: d.id, tier: d.tier, alive: true };
      }),
      monsterDeck: diff.monsterDice.map(tier => ({ tier, alive: true })),
      round: 1,
      log: [],
      playerRoll: null,
      monsterRoll: null,
      bonusRolls: [],
    });
    setPhase('battle');
  };

  const rollPlayerDie = (dieIndex: number) => {
    if (!battle || rolling) return;
    const pDie = battle.playerDeck[dieIndex];
    if (!pDie.alive) return;

    setRolling(true);

    // Player rolls
    const pFace = rollDie(pDie.tier);

    // Monster picks a random alive die
    const aliveMonster = battle.monsterDeck
      .map((d, i) => ({ ...d, index: i }))
      .filter(d => d.alive);
    const mPick = aliveMonster[Math.floor(Math.random() * aliveMonster.length)];
    const mFace = mPick ? rollDie(mPick.tier) : 'rot' as DiceFace;

    setTimeout(() => {
      setBattle(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        next.playerRoll = { face: pFace, dieIndex };
        next.monsterRoll = mPick ? { face: mFace, dieIndex: mPick.index } : null;
        next.log = [...prev.log];
        next.playerDeck = prev.playerDeck.map(d => ({ ...d }));
        next.monsterDeck = prev.monsterDeck.map(d => ({ ...d }));
        next.bonusRolls = [];

        // Resolve player roll
        if (pFace === 'rot') {
          next.playerDeck[dieIndex].alive = false;
          next.log.push({ text: `${getDiceFaceIcon('rot')} ${l.dieDestroyed}`, type: 'info' });
        }
        if (mFace === 'rot' && mPick) {
          next.monsterDeck[mPick.index].alive = false;
          next.log.push({ text: `${getDiceFaceIcon('rot')} Monster ${l.dieDestroyed}`, type: 'info' });
        }

        // Damage resolution
        let playerDmg = pFace === 'sword' ? 1 : 0;
        let monsterDmg = mFace === 'sword' ? 1 : 0;

        if (playerDmg > 0 && mFace === 'shield') {
          playerDmg = 0;
          next.log.push({ text: `🛡️ ${l.blocked}`, type: 'monster' });
        }
        if (monsterDmg > 0 && pFace === 'shield') {
          monsterDmg = 0;
          next.log.push({ text: `🛡️ ${l.blocked}`, type: 'player' });
        }

        if (playerDmg > 0) {
          next.monsterHP = Math.max(0, prev.monsterHP - playerDmg);
          next.log.push({ text: `⚔️ 1 ${l.damage}`, type: 'player' });
        }
        if (monsterDmg > 0) {
          next.playerHP = Math.max(0, prev.playerHP - monsterDmg);
          next.log.push({ text: `⚔️ 1 ${l.damage}`, type: 'monster' });
        }

        // Tree bonus rolls
        if (pFace === 'tree' && pDie.tier > 1) {
          const bonusTier = pDie.tier - 1;
          const bonusFace = rollDie(bonusTier);
          next.bonusRolls.push({ tier: bonusTier, face: bonusFace });
          next.log.push({ text: `🌳 ${l.bonusRoll} T${bonusTier}: ${getDiceFaceIcon(bonusFace)}`, type: 'player' });
          if (bonusFace === 'sword') {
            // Check if monster has shield this round - simplified: no double shield
            next.monsterHP = Math.max(0, next.monsterHP - 1);
          }
        }
        if (mFace === 'tree' && mPick && mPick.tier > 1) {
          const bonusTier = mPick.tier - 1;
          const bonusFace = rollDie(bonusTier);
          next.log.push({ text: `🌳 Monster ${l.bonusRoll} T${bonusTier}: ${getDiceFaceIcon(bonusFace)}`, type: 'monster' });
          if (bonusFace === 'sword') {
            next.playerHP = Math.max(0, next.playerHP - 1);
          }
        }

        next.round = prev.round + 1;

        // Check end conditions
        if (next.playerHP <= 0 || next.monsterHP <= 0) {
          // Will transition to result in next render
        }

        return next;
      });
      setRolling(false);
    }, 600);
  };

  // Check for game end
  const isGameOver = battle && (battle.playerHP <= 0 || battle.monsterHP <= 0 ||
    !battle.playerDeck.some(d => d.alive) || !battle.monsterDeck.some(d => d.alive));
  const playerWon = battle ? battle.monsterHP <= 0 || !battle.monsterDeck.some(d => d.alive) : false;

  if (phase === 'select-deck') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">{l.selectDeck}</h3>
        <DiceInventory
          dice={dice}
          selectedIds={selectedDiceIds}
          onSelectDie={handleSelectDie}
          maxSelect={5}
          language={language}
        />
        {selectedDiceIds.length === 5 && (
          <Button onClick={() => setPhase('select-difficulty')} className="w-full gap-2">
            <Swords className="w-4 h-4" />
            {l.continue}
          </Button>
        )}
      </div>
    );
  }

  if (phase === 'select-difficulty') {
    // Calculate average tier of selected dice
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
            const avgMonster = diff.monsterDice.reduce((a, b) => a + b, 0) / diff.monsterDice.length;
            const isRecommended = Math.abs(avgTier - avgMonster) <= 1.5;

            return (
              <Card
                key={diff.id}
                className="p-4 cursor-pointer hover:scale-[1.02] transition-all"
                onClick={() => startBattle(diff)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{diff.name[language]}</p>
                    <p className="text-xs text-muted-foreground">
                      Monster: {diff.monsterDice.map(t => `T${t}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRecommended && (
                      <Badge variant="secondary" className="text-xs">{l.recommended}</Badge>
                    )}
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

  if (phase === 'battle' && battle) {
    if (isGameOver) {
      return (
        <div className="space-y-6 text-center py-8">
          <h2 className="text-3xl font-bold">{playerWon ? l.victory : l.defeat}</h2>
          {playerWon && difficulty && (
            <div className="space-y-2">
              <p className="text-lg">{l.reward}: <span className="font-bold text-primary">💰 {difficulty.reward.coins.toLocaleString()} {l.coins}</span></p>
            </div>
          )}
          {!playerWon && (
            <p className="text-muted-foreground">{l.lost}</p>
          )}
          <Button
            onClick={() => {
              onBattleEnd(playerWon, selectedDiceIds, playerWon && difficulty ? difficulty.reward.coins : 0);
              setPhase('select-deck');
              setSelectedDiceIds([]);
              setBattle(null);
              setDifficulty(null);
            }}
            className="gap-2"
          >
            {l.continue}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* HP Bars */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-red-500" />
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

        {/* Round display */}
        <p className="text-center text-sm font-semibold">{l.round} {battle.round}</p>

        {/* Last roll display */}
        {battle.playerRoll && battle.monsterRoll && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <Card className="p-3">
              <p className="text-3xl">{getDiceFaceIcon(battle.playerRoll.face)}</p>
              <p className="text-xs text-muted-foreground mt-1">T{battle.playerDeck[battle.playerRoll.dieIndex]?.tier}</p>
            </Card>
            <Card className="p-3">
              <p className="text-3xl">{getDiceFaceIcon(battle.monsterRoll.face)}</p>
              <p className="text-xs text-muted-foreground mt-1">Monster T{battle.monsterDeck[battle.monsterRoll.dieIndex]?.tier}</p>
            </Card>
          </div>
        )}

        {/* Bonus rolls */}
        {battle.bonusRolls.length > 0 && (
          <div className="text-center">
            <Badge variant="secondary" className="gap-1">
              🌳 {battle.bonusRolls.map(b => `T${b.tier}: ${getDiceFaceIcon(b.face)}`).join(' | ')}
            </Badge>
          </div>
        )}

        {/* Player dice selection */}
        <div>
          <p className="text-sm font-semibold mb-2">{l.yourTurn}</p>
          <div className="grid grid-cols-5 gap-2">
            {battle.playerDeck.map((die, i) => (
              <Card
                key={i}
                className={`p-2 text-center transition-all ${die.alive ? 'cursor-pointer hover:scale-105' : 'opacity-30 line-through'}`}
                onClick={() => die.alive && !rolling && rollPlayerDie(i)}
              >
                <div className="text-lg font-bold">T{die.tier}</div>
                <div className="flex justify-center gap-0.5 flex-wrap">
                  {(DICE_TIERS[die.tier] || []).map((f, j) => (
                    <span key={j} className="text-xs">{getDiceFaceIcon(f as DiceFace)}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Monster dice */}
        <div>
          <p className="text-sm font-semibold mb-2 text-destructive">Monster</p>
          <div className="grid grid-cols-5 gap-2">
            {battle.monsterDeck.map((die, i) => (
              <Card key={i} className={`p-2 text-center ${die.alive ? '' : 'opacity-30'}`}>
                <div className="text-lg font-bold">T{die.tier}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="max-h-32 overflow-y-auto space-y-1 text-xs border rounded-lg p-2 bg-muted/30">
          {battle.log.slice(-8).map((entry, i) => (
            <p key={i} className={entry.type === 'player' ? 'text-primary' : entry.type === 'monster' ? 'text-destructive' : 'text-muted-foreground'}>
              {entry.text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
