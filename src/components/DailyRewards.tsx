import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Gift, Star } from 'lucide-react';
import { toast } from 'sonner';

interface DailyRewardsProps {
  onRewardClaimed: () => void;
  language?: 'en' | 'ru';
}

export function DailyRewards({ onRewardClaimed, language = 'ru' }: DailyRewardsProps) {
  const { user } = useAuth();
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [canClaimWeekly, setCanClaimWeekly] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMonday = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const checkRewards = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getMonday(new Date());

      const [dailyRes, weeklyRes] = await Promise.all([
        supabase
          .from('daily_rewards')
          .select('*')
          .eq('user_id', user.id)
          .eq('reward_date', today)
          .eq('reward_type', 'daily_trash')
          .maybeSingle(),
        supabase
          .from('daily_rewards')
          .select('*')
          .eq('user_id', user.id)
          .eq('reward_date', weekStart)
          .eq('reward_type', 'weekly_normal')
          .maybeSingle()
      ]);

      if (dailyRes.error) throw dailyRes.error;
      if (weeklyRes.error) throw weeklyRes.error;

      setCanClaimDaily(!dailyRes.data || !dailyRes.data.claimed);
      setCanClaimWeekly(!weeklyRes.data || !weeklyRes.data.claimed);
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

  const claimReward = async (type: 'daily' | 'weekly') => {
    if (!user) return;

    const setIsLoading = type === 'daily' ? setIsLoadingDaily : setIsLoadingWeekly;
    setIsLoading(true);

    try {
      const rewardDate = type === 'daily'
        ? new Date().toISOString().split('T')[0]
        : getMonday(new Date());
      const rewardType = type === 'daily' ? 'daily_trash' : 'weekly_normal';
      const pickaxeType = type === 'daily' ? 'trash' : 'normal';
      const pickaxeName = type === 'daily'
        ? (language === 'ru' ? 'Ежедневная кирка' : 'Daily Pickaxe')
        : (language === 'ru' ? 'Еженедельная кирка' : 'Weekly Pickaxe');

      const { error: rewardError } = await supabase
        .from('daily_rewards')
        .upsert({
          user_id: user.id,
          reward_date: rewardDate,
          claimed: true,
          reward_type: rewardType
        });

      if (rewardError) throw rewardError;

      const { error: pickaxeError } = await supabase
        .from('pickaxes')
        .insert({
          user_id: user.id,
          type: pickaxeType,
          name: pickaxeName,
          used: false
        });

      if (pickaxeError) throw pickaxeError;

      if (type === 'daily') setCanClaimDaily(false);
      else setCanClaimWeekly(false);

      onRewardClaimed();

      const msg = type === 'daily'
        ? (language === 'ru' ? '🎁 Получена ежедневная кирка (trash)!' : '🎁 Daily trash pickaxe received!')
        : (language === 'ru' ? '⭐ Получена еженедельная кирка (normal)!' : '⭐ Weekly normal pickaxe received!');
      toast.success(msg);
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast.error(language === 'ru' ? 'Ошибка получения награды' : 'Failed to claim reward');
    } finally {
      setIsLoading(false);
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

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        {language === 'ru' ? 'Награды' : 'Rewards'}
      </h2>
      
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
          <div className="flex items-center gap-2">
            {canClaimDaily ? (
              <Button 
                onClick={() => claimReward('daily')}
                disabled={isLoadingDaily}
                variant="outline"
                className="gap-2"
              >
                <Gift className="w-4 h-4" />
                {isLoadingDaily 
                  ? (language === 'ru' ? 'Получение...' : 'Claiming...') 
                  : (language === 'ru' ? 'Получить' : 'Claim')
                }
              </Button>
            ) : (
              <Badge variant="secondary">
                {language === 'ru' ? 'Получено' : 'Claimed'}
              </Badge>
            )}
          </div>
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
                {language === 'ru' ? 'Normal кирка каждую неделю' : 'Free normal pickaxe every week'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canClaimWeekly ? (
              <Button 
                onClick={() => claimReward('weekly')}
                disabled={isLoadingWeekly}
                className="gap-2"
              >
                <Star className="w-4 h-4" />
                {isLoadingWeekly 
                  ? (language === 'ru' ? 'Получение...' : 'Claiming...') 
                  : (language === 'ru' ? 'Получить' : 'Claim')
                }
              </Button>
            ) : (
              <Badge variant="secondary">
                {language === 'ru' ? 'Получено' : 'Claimed'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
