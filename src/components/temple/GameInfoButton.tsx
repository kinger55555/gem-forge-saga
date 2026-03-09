import { useState, useEffect } from 'react';
import { Info, ShieldAlert, BarChart3, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/utils/linkUtils';
import { toast } from 'sonner';

interface GameInfoButtonProps {
  gameId: string;
  title: string;
  rules: string;
  language: 'en' | 'ru';
}

export function GameInfoButton({ gameId, title, rules, language }: GameInfoButtonProps) {
  const { user } = useAuth();
  const admin = user ? isAdmin(user) : false;
  const [open, setOpen] = useState(false);
  const [playCount, setPlayCount] = useState<number>(0);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !admin) return;
    (async () => {
      const { data } = await supabase
        .from('game_stats')
        .select('play_count, blocked')
        .eq('game_id', gameId)
        .maybeSingle();
      if (data) {
        setPlayCount(Number(data.play_count));
        setBlocked(data.blocked);
      }
    })();
  }, [open, admin, gameId]);

  const toggleBlock = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('game_stats')
      .update({ blocked: !blocked })
      .eq('game_id', gameId);
    if (error) {
      toast.error(language === 'ru' ? 'Ошибка' : 'Error');
    } else {
      setBlocked(!blocked);
      toast.success(
        !blocked
          ? (language === 'ru' ? 'Игра заблокирована' : 'Game blocked')
          : (language === 'ru' ? 'Игра разблокирована' : 'Game unblocked')
      );
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Info className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground whitespace-pre-line">{rules}</p>

        {admin && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldAlert className="w-4 h-4" />
              {language === 'ru' ? 'Панель админа' : 'Admin Panel'}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              {language === 'ru' ? 'Сыграно раз:' : 'Times played:'}{' '}
              <span className="font-bold">{playCount.toLocaleString()}</span>
            </div>

            <Button
              variant={blocked ? 'default' : 'destructive'}
              size="sm"
              className="w-full"
              onClick={toggleBlock}
              disabled={loading}
            >
              {blocked ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Разблокировать игру' : 'Unblock Game'}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Заблокировать игру' : 'Block Game'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
