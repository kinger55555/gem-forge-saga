import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface DailyRewardsProps {
  onRewardClaimed: () => void;
  language?: 'en' | 'ru';
}

export function DailyRewards({ onRewardClaimed, language = 'ru' }: DailyRewardsProps) {
  const { user } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkDailyReward = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('reward_date', today)
        .maybeSingle();

      if (error) throw error;

      setCanClaim(!data || !data.claimed);
      setLoading(false);
    } catch (error: any) {
      console.error('Error checking daily reward:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkDailyReward();
    }
  }, [user]);

  const claimDailyReward = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Insert or update daily reward
      const { error: rewardError } = await supabase
        .from('daily_rewards')
        .upsert({
          user_id: user.id,
          reward_date: today,
          claimed: true,
          reward_type: 'pickaxe'
        });

      if (rewardError) throw rewardError;

      // Give a normal pickaxe
      const { error: pickaxeError } = await supabase
        .from('pickaxes')
        .insert({
          user_id: user.id,
          type: 'normal',
          name: 'Daily Pickaxe',
          used: false
        });

      if (pickaxeError) throw pickaxeError;

      setCanClaim(false);
      onRewardClaimed();
      toast.success(language === 'ru' ? '🎁 Получена ежедневная кирка!' : '🎁 Daily pickaxe received!');
    } catch (error: any) {
      console.error('Error claiming daily reward:', error);
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
        {language === 'ru' ? 'Ежедневная награда' : 'Daily Reward'}
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="font-semibold">
                {language === 'ru' ? 'Ежедневная кирка' : 'Daily Pickaxe'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Получайте бесплатную кирку каждый день' : 'Get a free pickaxe every day'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canClaim ? (
              <Button 
                onClick={claimDailyReward}
                disabled={isLoading}
                className="gap-2"
              >
                <Gift className="w-4 h-4" />
                {isLoading 
                  ? (language === 'ru' ? 'Получение...' : 'Claiming...') 
                  : (language === 'ru' ? 'Получить' : 'Claim')
                }
              </Button>
            ) : (
              <Badge variant="secondary">
                {language === 'ru' ? 'Получено сегодня' : 'Claimed today'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}