import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dice, DiceFace, rollDie, getDiceFaceIcon, getTierName } from '@/types/dice';
import { DiceInventory } from './DiceInventory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Swords, ArrowLeft, Users, Clock, Trophy, Loader2, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DiceDuelProps {
  dice: Dice[];
  onDuelEnd: (won: boolean, coinsWon: number) => void;
  language: 'en' | 'ru';
}

type Phase = 'menu' | 'select-deck' | 'waiting' | 'battle' | 'result';

interface DuelState {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_dice: any[];
  player2_dice: any[];
  player1_hp: number;
  player2_hp: number;
  current_round: number;
  round_data: any[];
  status: string;
  winner_id: string | null;
  coins_wager: number;
}

const t = {
  en: {
    title: 'PvP Dice Duel',
    createDuel: 'Create Duel',
    joinDuel: 'Join Duel',
    selectDeck: 'Select 5 dice for battle',
    waiting: 'Waiting for opponent...',
    shareCode: 'Share this code',
    enterCode: 'Enter duel code',
    join: 'Join',
    back: 'Back',
    continue: 'Continue',
    roll: 'Roll!',
    yourTurn: 'Your turn to roll',
    opponentTurn: 'Opponent rolling...',
    victory: '🎉 Victory!',
    defeat: '💀 Defeat!',
    reward: 'Reward',
    coins: 'coins',
    lost: 'Better luck next time',
    round: 'Round',
    you: 'You',
    opponent: 'Opponent',
    wager: 'Wager',
    needMore: 'Need at least 5 dice',
    openDuels: 'Open Duels',
    noDuels: 'No open duels. Create one!',
    copied: 'Copied!',
  },
  ru: {
    title: 'PvP Дуэль',
    createDuel: 'Создать дуэль',
    joinDuel: 'Войти в дуэль',
    selectDeck: 'Выбери 5 кубиков для боя',
    waiting: 'Ожидание противника...',
    shareCode: 'Поделись кодом',
    enterCode: 'Введи код дуэли',
    join: 'Войти',
    back: 'Назад',
    continue: 'Продолжить',
    roll: 'Бросить!',
    yourTurn: 'Твой бросок',
    opponentTurn: 'Противник бросает...',
    victory: '🎉 Победа!',
    defeat: '💀 Поражение!',
    reward: 'Награда',
    coins: 'монет',
    lost: 'Повезёт в следующий раз',
    round: 'Раунд',
    you: 'Ты',
    opponent: 'Противник',
    wager: 'Ставка',
    needMore: 'Нужно минимум 5 кубиков',
    openDuels: 'Открытые дуэли',
    noDuels: 'Нет дуэлей. Создай свою!',
    copied: 'Скопировано!',
  },
};

const WAGER = 5000;

export function DiceDuel({ dice, onDuelEnd, language }: DiceDuelProps) {
  const l = t[language];
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('menu');
  const [selectedDiceIds, setSelectedDiceIds] = useState<string[]>([]);
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [openDuels, setOpenDuels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [myRolled, setMyRolled] = useState<{ face: DiceFace; tier: number }[]>([]);
  const [opRolled, setOpRolled] = useState<{ face: DiceFace; tier: number }[]>([]);
  const [rolling, setRolling] = useState(false);
  const [roundLog, setRoundLog] = useState<string[]>([]);

  const handleSelectDie = useCallback((die: Dice) => {
    setSelectedDiceIds(prev =>
      prev.includes(die.id) ? prev.filter(id => id !== die.id) : [...prev, die.id]
    );
  }, []);

  // Load open duels
  const loadOpenDuels = useCallback(async () => {
    const { data } = await supabase
      .from('dice_duels')
      .select('*')
      .eq('status', 'waiting')
      .neq('player1_id', user?.id || '')
      .order('created_at', { ascending: false })
      .limit(10);
    setOpenDuels(data || []);
  }, [user]);

  useEffect(() => {
    if (phase === 'menu') loadOpenDuels();
  }, [phase, loadOpenDuels]);

  // Subscribe to duel changes
  useEffect(() => {
    if (!duel?.id) return;

    const channel = supabase
      .channel(`duel-${duel.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'dice_duels',
        filter: `id=eq.${duel.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        setDuel(updated);

        if (updated.status === 'active' && updated.player2_id && phase === 'waiting') {
          setPhase('battle');
        }
        if (updated.status === 'finished') {
          setPhase('result');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [duel?.id, phase]);

  // Create a new duel
  const createDuel = async () => {
    if (!user) return;
    setLoading(true);

    const selectedDice = selectedDiceIds.map(id => {
      const d = dice.find(x => x.id === id)!;
      return { tier: d.tier, color: d.color };
    });

    const { data, error } = await supabase
      .from('dice_duels')
      .insert({
        player1_id: user.id,
        player1_dice: selectedDice as any,
        coins_wager: WAGER,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    setDuel(data as any);
    setIsPlayer1(true);
    setPhase('waiting');
    setLoading(false);
  };

  // Join a duel
  const joinDuel = async (duelId: string) => {
    if (!user) return;
    setLoading(true);

    const selectedDice = selectedDiceIds.map(id => {
      const d = dice.find(x => x.id === id)!;
      return { tier: d.tier, color: d.color };
    });

    const { data, error } = await supabase
      .from('dice_duels')
      .update({
        player2_id: user.id,
        player2_dice: selectedDice as any,
        status: 'active',
        current_round: 1,
      })
      .eq('id', duelId)
      .eq('status', 'waiting')
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    setDuel(data as any);
    setIsPlayer1(false);
    setPhase('battle');
    setLoading(false);
  };

  // Roll dice for this round
  const rollDice = async () => {
    if (!duel || rolling) return;
    setRolling(true);

    const myDice = isPlayer1 ? duel.player1_dice : duel.player2_dice;
    const opDice = isPlayer1 ? duel.player2_dice : duel.player1_dice;

    // Roll my dice
    const myRolls = myDice.map((d: any) => ({
      face: rollDie(d.tier) as DiceFace,
      tier: d.tier,
    }));
    // Simulate opponent rolls
    const opRolls = opDice.map((d: any) => ({
      face: rollDie(d.tier) as DiceFace,
      tier: d.tier,
    }));

    setMyRolled(myRolls);
    setOpRolled(opRolls);

    // Calculate damage
    const mySwords = myRolls.filter((r: any) => r.face === 'sword' || r.face === 'tree').length;
    const myShields = myRolls.filter((r: any) => r.face === 'shield').length;
    const opSwords = opRolls.filter((r: any) => r.face === 'sword' || r.face === 'tree').length;
    const opShields = opRolls.filter((r: any) => r.face === 'shield').length;

    const dmgToOp = Math.max(0, mySwords - opShields);
    const dmgToMe = Math.max(0, opSwords - myShields);

    const newMyHp = Math.max(0, (isPlayer1 ? duel.player1_hp : duel.player2_hp) - dmgToMe);
    const newOpHp = Math.max(0, (isPlayer1 ? duel.player2_hp : duel.player1_hp) - dmgToOp);

    const log: string[] = [];
    if (dmgToOp > 0) log.push(`⚔️ ${language === 'ru' ? 'Ты нанёс' : 'You dealt'} ${dmgToOp} ${language === 'ru' ? 'урона' : 'damage'}`);
    if (dmgToMe > 0) log.push(`⚔️ ${language === 'ru' ? 'Противник нанёс' : 'Opponent dealt'} ${dmgToMe} ${language === 'ru' ? 'урона' : 'damage'}`);
    if (myShields > 0 && opSwords > 0) log.push(`🛡️ ${language === 'ru' ? 'Заблокировано' : 'Blocked'} ${Math.min(myShields, opSwords)}`);
    setRoundLog(log);

    // Update duel state
    const updateData: any = {
      current_round: duel.current_round + 1,
      round_data: [...(duel.round_data || []), { myRolls, opRolls, dmgToOp, dmgToMe }],
      updated_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      updateData.player1_hp = newMyHp;
      updateData.player2_hp = newOpHp;
    } else {
      updateData.player1_hp = newOpHp;
      updateData.player2_hp = newMyHp;
    }

    // Check for game over
    if (newMyHp <= 0 || newOpHp <= 0) {
      updateData.status = 'finished';
      updateData.winner_id = newOpHp <= 0 ? user?.id : (isPlayer1 ? duel.player2_id : duel.player1_id);
    }

    await supabase.from('dice_duels').update(updateData).eq('id', duel.id);

    setDuel(prev => prev ? { ...prev, ...updateData } : prev);

    if (updateData.status === 'finished') {
      setPhase('result');
    }

    setRolling(false);
  };

  const cancelDuel = async () => {
    if (duel) {
      await supabase.from('dice_duels').delete().eq('id', duel.id);
    }
    setDuel(null);
    setPhase('menu');
  };

  const handleCopyCode = () => {
    if (duel) {
      navigator.clipboard.writeText(duel.id.slice(0, 8));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // MENU
  if (phase === 'menu') {
    if (dice.length < 5) {
      return <p className="text-center text-muted-foreground py-8">{l.needMore}</p>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
          <Swords className="w-5 h-5" /> {l.title}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setPhase('select-deck')} className="gap-2 py-6" size="lg">
            <Swords className="w-5 h-5" /> {l.createDuel}
          </Button>
          <div className="flex gap-1">
            <Input
              placeholder={l.enterCode}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {joinCode.length >= 8 && (
          <Button
            onClick={() => {
              // Find duel by partial ID
              setPhase('select-deck');
            }}
            className="w-full gap-2"
            variant="secondary"
          >
            <Users className="w-4 h-4" /> {l.join}
          </Button>
        )}

        {/* Open duels */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> {l.openDuels}
          </h4>
          {openDuels.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{l.noDuels}</p>
          ) : (
            openDuels.map(d => (
              <Card key={d.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">💰 {d.coins_wager.toLocaleString()} {l.coins}</p>
                  <p className="text-xs text-muted-foreground">{d.id.slice(0, 8)}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setJoinCode(d.id);
                    setPhase('select-deck');
                  }}
                >
                  {l.join}
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // SELECT DECK
  if (phase === 'select-deck') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setPhase('menu'); setSelectedDiceIds([]); }} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> {l.back}
        </Button>
        <h3 className="text-lg font-bold text-center">{l.selectDeck}</h3>
        <DiceInventory dice={dice} selectedIds={selectedDiceIds} onSelectDie={handleSelectDie} maxSelect={5} language={language} />
        {selectedDiceIds.length === 5 && (
          <Button
            onClick={async () => {
              if (joinCode) {
                // Join existing duel
                const targetId = openDuels.find(d => d.id === joinCode)?.id || joinCode;
                // Try to find by partial ID
                const { data } = await supabase
                  .from('dice_duels')
                  .select('*')
                  .eq('status', 'waiting')
                  .ilike('id', `${joinCode}%`)
                  .single();
                if (data) {
                  await joinDuel(data.id);
                } else {
                  toast({ title: 'Error', description: language === 'ru' ? 'Дуэль не найдена' : 'Duel not found', variant: 'destructive' });
                }
              } else {
                await createDuel();
              }
            }}
            className="w-full gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
            {joinCode ? l.join : l.createDuel}
          </Button>
        )}
      </div>
    );
  }

  // WAITING
  if (phase === 'waiting' && duel) {
    return (
      <div className="space-y-6 text-center py-8">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        <h3 className="text-xl font-bold">{l.waiting}</h3>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{l.shareCode}:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-2xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded-lg">
              {duel.id.slice(0, 8)}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Badge variant="outline" className="text-lg">💰 {WAGER.toLocaleString()} {l.coins}</Badge>

        <Button variant="destructive" onClick={cancelDuel} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {l.back}
        </Button>
      </div>
    );
  }

  // BATTLE
  if (phase === 'battle' && duel) {
    const myHp = isPlayer1 ? duel.player1_hp : duel.player2_hp;
    const opHp = isPlayer1 ? duel.player2_hp : duel.player1_hp;
    const myDice = isPlayer1 ? duel.player1_dice : duel.player2_dice;
    const opDice = isPlayer1 ? duel.player2_dice : duel.player1_dice;

    return (
      <div className="space-y-4 animate-fade-in">
        {/* HP bars */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold mb-1">💚 {l.you}: {myHp}/5</p>
            <Progress value={(myHp / 5) * 100} className="h-3" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">❤️ {l.opponent}: {opHp}/5</p>
            <Progress value={(opHp / 5) * 100} className="h-3" />
          </div>
        </div>

        <p className="text-center text-sm font-semibold">{l.round} {duel.current_round}</p>

        {/* Rolled results */}
        {myRolled.length > 0 && (
          <div className="space-y-3 animate-scale-in">
            <div className="grid grid-cols-5 gap-2">
              {myRolled.map((r, i) => (
                <Card key={i} className="p-2 text-center">
                  <div
                    className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xl shadow-md"
                    style={{ backgroundColor: myDice[i]?.color || 'hsl(var(--primary))' }}
                  >
                    {getDiceFaceIcon(r.face)}
                  </div>
                  <p className="text-[10px]">T{r.tier}</p>
                </Card>
              ))}
            </div>

            <p className="text-xs text-center text-muted-foreground">vs</p>

            <div className="grid grid-cols-5 gap-2">
              {opRolled.map((r, i) => (
                <Card key={i} className="p-2 text-center">
                  <div className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xl bg-destructive/20">
                    {getDiceFaceIcon(r.face)}
                  </div>
                  <p className="text-[10px]">T{r.tier}</p>
                </Card>
              ))}
            </div>

            {/* Log */}
            {roundLog.length > 0 && (
              <div className="space-y-1 text-xs border rounded-lg p-2 bg-muted/30">
                {roundLog.map((entry, i) => <p key={i}>{entry}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Roll button */}
        <Button onClick={rollDice} disabled={rolling} className="w-full gap-2 text-lg py-6">
          {rolling ? '🎲...' : `🎲 ${l.roll}`}
        </Button>
      </div>
    );
  }

  // RESULT
  if (phase === 'result' && duel) {
    const iWon = duel.winner_id === user?.id;
    return (
      <div className="space-y-6 text-center py-8 animate-fade-in">
        <h2 className="text-3xl font-bold">{iWon ? l.victory : l.defeat}</h2>
        {iWon ? (
          <p className="text-lg">{l.reward}: <span className="font-bold text-primary">💰 {(WAGER * 2).toLocaleString()} {l.coins}</span></p>
        ) : (
          <p className="text-muted-foreground">{l.lost}</p>
        )}
        <Button onClick={() => {
          onDuelEnd(iWon, iWon ? WAGER * 2 : 0);
          setPhase('menu');
          setDuel(null);
          setSelectedDiceIds([]);
          setMyRolled([]);
          setOpRolled([]);
          setJoinCode('');
        }}>
          {l.continue}
        </Button>
      </div>
    );
  }

  return null;
}
