import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Gift, Star, Flame, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface DailyRewardsProps {
  onRewardClaimed: () => void;
  language?: 'en' | 'ru';
}

const STREAK_MILESTONES = [
  { days: 3, pickaxeType: 'trash', label: { ru: 'Trash кирка', en: 'Trash pickaxe' } },
  { days: 7, pickaxeType: 'normal', label: { ru: 'Normal кирка', en: 'Normal pickaxe' } },
  { days: 14, pickaxeType: 'rare', label: { ru: 'Rare кирка', en: 'Rare pickaxe' } },
  { days: 30, pickaxeType: 'epic', label: { ru: 'Epic кирка', en: 'Epic pickaxe' } },
];

export function DailyRewards({ onRewardClaimed, language = 'ru' }: DailyRewardsProps) {
  const { user } = useAuth();
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [canClaimWeekly, setCanClaimWeekly] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [daysUntilWeekly, setDaysUntilWeekly] = useState(0);

  const checkRewards = async () => {
    if (!user) return;

    try {
      const { data: gameState, error } = await supabase
        .from('game_state')
        .select('last_daily_claim, last_weekly_claim, streak_count')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const today = new Date(todayStr + 'T00:00:00Z');

      // Daily check
      if (gameState?.last_daily_claim) {
        const lastClaim = new Date(gameState.last_daily_claim + 'T00:00:00Z');
        setCanClaimDaily(lastClaim.getTime() < today.getTime());
      } else {
        setCanClaimDaily(true);
      }

      // Weekly check: 7 days since last weekly claim
      if (gameState?.last_weekly_claim) {
        const lastWeekly = new Date(gameState.last_weekly_claim + 'T00:00:00');
        const diffDays = Math.floor((today.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24));
        setCanClaimWeekly(diffDays >= 7);
        setDaysUntilWeekly(Math.max(0, 7 - diffDays));
      } else {
        setCanClaimWeekly(true);
        setDaysUntilWeekly(0);
      }

      setStreak(gameState?.streak_count ?? 0);
      setLoading(false);
    } catch (error: any) {
      console.error('Error checking rewards:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkRewards();
    }
  }, [user]);

  const claimDaily = async () => {
    if (!user) return;
    setIsLoadingDaily(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Get current game state for streak calc
      const { data: gameState } = await supabase
        .from('game_state')
        .select('last_daily_claim, streak_count')
        .eq('user_id', user.id)
        .maybeSingle();

      // Calculate new streak
      let newStreak = 1;
      if (gameState?.last_daily_claim) {
        const lastClaim = new Date(gameState.last_daily_claim + 'T00:00:00');
        const diffDays = Math.floor((today.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak = (gameState.streak_count ?? 0) + 1;
        }
        // If diffDays > 1, streak resets to 1
      }

      // Update game_state
      const { error: updateError } = await supabase
        .from('game_state')
        .update({
          last_daily_claim: todayStr,
          streak_count: newStreak,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Give trash pickaxe
      const { error: pickaxeError } = await supabase
        .from('pickaxes')
        .insert({
          user_id: user.id,
          type: 'trash',
          name: language === 'ru' ? 'Ежедневная кирка' : 'Daily Pickaxe',
          used: false
        });

      if (pickaxeError) throw pickaxeError;

      // Check streak milestones
      const bonuses: string[] = [];
      for (const milestone of STREAK_MILESTONES) {
        if (newStreak === milestone.days) {
          await supabase.from('pickaxes').insert({
            user_id: user.id,
            type: milestone.pickaxeType,
            name: `Streak ${milestone.days} Bonus`,
            used: false
          });
          bonuses.push(milestone.label[language]);
        }
      }

      setCanClaimDaily(false);
      setStreak(newStreak);
      onRewardClaimed();

      let msg = language === 'ru'
        ? `🎁 Trash кирка получена! Серия: ${newStreak} 🔥`
        : `🎁 Trash pickaxe received! Streak: ${newStreak} 🔥`;

      if (bonuses.length > 0) {
        msg += language === 'ru'
          ? `\n🏆 Бонус за серию: ${bonuses.join(', ')}!`
          : `\n🏆 Streak bonus: ${bonuses.join(', ')}!`;
      }

      toast.success(msg);
    } catch (error: any) {
      console.error('Error claiming daily:', error);
      toast.error(language === 'ru' ? 'Ошибка получения награды' : 'Failed to claim reward');
    } finally {
      setIsLoadingDaily(false);
    }
  };

  const claimWeekly = async () => {
    if (!user) return;
    setIsLoadingWeekly(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const { error: updateError } = await supabase
        .from('game_state')
        .update({
          last_weekly_claim: todayStr,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: pickaxeError } = await supabase
        .from('pickaxes')
        .insert({
          user_id: user.id,
          type: 'normal',
          name: language === 'ru' ? 'Еженедельная кирка' : 'Weekly Pickaxe',
          used: false
        });

      if (pickaxeError) throw pickaxeError;

      setCanClaimWeekly(false);
      setDaysUntilWeekly(7);
      onRewardClaimed();
      toast.success(language === 'ru' ? '⭐ Normal кирка получена!' : '⭐ Normal pickaxe received!');
    } catch (error: any) {
      console.error('Error claiming weekly:', error);
      toast.error(language === 'ru' ? 'Ошибка получения награды' : 'Failed to claim reward');
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-2"></div>
          <div className="h-8 bg-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        {language === 'ru' ? 'Награды' : 'Rewards'}
      </h2>

      {/* Streak display */}
      {streak > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent/50">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-lg">{streak}</span>
          <span className="text-sm text-muted-foreground">
            {language === 'ru' ? 'дней подряд' : 'day streak'}
          </span>
          {nextMilestone && (
            <Badge variant="outline" className="ml-auto text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              {language === 'ru'
                ? `${nextMilestone.label.ru} через ${nextMilestone.days - streak} дн.`
                : `${nextMilestone.label.en} in ${nextMilestone.days - streak}d`}
            </Badge>
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* Daily trash pickaxe */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">
                {language === 'ru' ? 'Ежедневная кирка' : 'Daily Pickaxe'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Trash кирка каждый день' : 'Free trash pickaxe every day'}
              </p>
            </div>
          </div>
          {canClaimDaily ? (
            <Button
              onClick={claimDaily}
              disabled={isLoadingDaily}
              variant="outline"
              className="gap-2"
            >
              <Gift className="w-4 h-4" />
              {isLoadingDaily
                ? (language === 'ru' ? 'Получение...' : 'Claiming...')
                : (language === 'ru' ? 'Получить' : 'Claim')}
            </Button>
          ) : (
            <Badge variant="secondary">
              {language === 'ru' ? 'Получено' : 'Claimed'}
            </Badge>
          )}
        </div>

        {/* Weekly normal pickaxe */}
        <div className="flex items-center justify-between p-4 border rounded-lg border-primary/30">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold">
                {language === 'ru' ? 'Еженедельная кирка' : 'Weekly Pickaxe'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {canClaimWeekly
                  ? (language === 'ru' ? 'Normal кирка доступна!' : 'Normal pickaxe available!')
                  : (language === 'ru' ? `Через ${daysUntilWeekly} дн.` : `In ${daysUntilWeekly} days`)}
              </p>
            </div>
          </div>
          {canClaimWeekly ? (
            <Button
              onClick={claimWeekly}
              disabled={isLoadingWeekly}
              className="gap-2"
            >
              <Star className="w-4 h-4" />
              {isLoadingWeekly
                ? (language === 'ru' ? 'Получение...' : 'Claiming...')
                : (language === 'ru' ? 'Получить' : 'Claim')}
            </Button>
          ) : (
            <Badge variant="secondary">
              {language === 'ru'
                ? `Через ${daysUntilWeekly} дн.`
                : `${daysUntilWeekly}d left`}
            </Badge>
          )}
        </div>

        {/* Streak milestones */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            {language === 'ru' ? 'Бонусы за серию' : 'Streak Bonuses'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {STREAK_MILESTONES.map((m) => (
              <div
                key={m.days}
                className={`p-2 rounded-lg border text-sm flex items-center gap-2 ${
                  streak >= m.days ? 'bg-primary/10 border-primary/30' : 'opacity-50'
                }`}
              >
                {streak >= m.days ? (
                  <Trophy className="w-4 h-4 text-primary" />
                ) : (
                  <Flame className="w-4 h-4 text-muted-foreground" />
                )}
                <span>
                  {m.days}d → {m.label[language]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
