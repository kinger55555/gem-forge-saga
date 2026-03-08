import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Crystal, Pickaxe as PickaxeType } from '@/types/game';
import { toast } from 'sonner';

interface GameData {
  pickaxes: PickaxeType[];
  crystals: Crystal[];
  coins: number;
  clickerEarnings: number;
  loading: boolean;
}

export function useGameData() {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<GameData>({
    pickaxes: [],
    crystals: [],
    coins: 0,
    clickerEarnings: 0,
    loading: true
  });

  const loadGameData = async () => {
    if (!user) return;

    try {
      const [pickaxesRes, crystalsRes, gameStateRes] = await Promise.all([
        supabase.from('pickaxes').select('*').eq('user_id', user.id),
        supabase.from('crystals').select('*').eq('user_id', user.id),
        supabase.from('game_state').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      if (pickaxesRes.error) throw pickaxesRes.error;
      if (crystalsRes.error) throw crystalsRes.error;
      if (gameStateRes.error) throw gameStateRes.error;

      // Create game_state row if it doesn't exist
      let gameState = gameStateRes.data;
      if (!gameState) {
        const { data: newState, error: createError } = await supabase
          .from('game_state')
          .insert({ user_id: user.id, coins: 0, clicker_earnings: 0 })
          .select()
          .single();
        if (createError) throw createError;
        gameState = newState;
      }

      setGameData({
        pickaxes: pickaxesRes.data.map(p => ({
          id: p.id,
          type: p.type as PickaxeType['type'],
          name: p.name,
          used: p.used
        })),
        crystals: crystalsRes.data.map(c => ({
          id: c.id,
          red: c.red,
          green: c.green,
          blue: c.blue,
          rarity: c.rarity,
          price: c.price,
          color: c.color
        })),
        coins: Number(gameState.coins),
        clickerEarnings: Number(gameState.clicker_earnings),
        loading: false
      });
    } catch (error: any) {
      console.error('Error loading game data:', error);
      toast.error('Failed to load game data');
      setGameData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (user) {
      loadGameData();
    } else {
      setGameData({
        pickaxes: [],
        crystals: [],
        coins: 0,
        clickerEarnings: 0,
        loading: false
      });
    }
  }, [user]);

  const saveCrystal = async (crystal: Crystal) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('crystals').insert({
        user_id: user.id,
        red: crystal.red,
        green: crystal.green,
        blue: crystal.blue,
        rarity: crystal.rarity,
        price: crystal.price,
        color: crystal.color
      }).select().single();

      if (error) throw error;

      const savedCrystal: Crystal = {
        id: data.id,
        red: data.red,
        green: data.green,
        blue: data.blue,
        rarity: data.rarity,
        price: data.price,
        color: data.color
      };

      setGameData(prev => ({
        ...prev,
        crystals: [...prev.crystals, savedCrystal]
      }));
    } catch (error: any) {
      console.error('Error saving crystal:', error);
      toast.error('Failed to save crystal');
    }
  };

  const usePickaxe = async (pickaxeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pickaxes')
        .update({ used: true })
        .eq('id', pickaxeId);

      if (error) throw error;

      setGameData(prev => ({
        ...prev,
        pickaxes: prev.pickaxes.map(p => 
          p.id === pickaxeId ? { ...p, used: true } : p
        )
      }));
    } catch (error: any) {
      console.error('Error using pickaxe:', error);
      toast.error('Failed to use pickaxe');
    }
  };

  const sellCrystal = async (crystalId: string, price: number) => {
    if (!user) return;

    try {
      const [deleteRes, updateRes] = await Promise.all([
        supabase.from('crystals').delete().eq('id', crystalId),
        supabase.from('game_state')
          .update({ coins: gameData.coins + price })
          .eq('user_id', user.id)
      ]);

      if (deleteRes.error) throw deleteRes.error;
      if (updateRes.error) throw updateRes.error;

      setGameData(prev => ({
        ...prev,
        crystals: prev.crystals.filter(c => c.id !== crystalId),
        coins: prev.coins + price
      }));

      toast.success(`Sold crystal for ${price.toLocaleString()} coins!`);
    } catch (error: any) {
      console.error('Error selling crystal:', error);
      toast.error('Failed to sell crystal');
    }
  };

  const buyPickaxe = async (type: PickaxeType['type'], price: number) => {
    if (!user || gameData.coins < price) return false;

    try {
      const name = `${type.charAt(0).toUpperCase() + type.slice(1)} Pickaxe`;
      
      const [insertRes, updateRes] = await Promise.all([
        supabase.from('pickaxes').insert({
          user_id: user.id,
          type,
          name,
          used: false
        }).select().single(),
        supabase.from('game_state')
          .update({ coins: gameData.coins - price })
          .eq('user_id', user.id)
      ]);

      if (insertRes.error) throw insertRes.error;
      if (updateRes.error) throw updateRes.error;

      const newPickaxe: PickaxeType = {
        id: insertRes.data.id,
        type: insertRes.data.type as PickaxeType['type'],
        name: insertRes.data.name,
        used: insertRes.data.used
      };

      setGameData(prev => ({
        ...prev,
        pickaxes: [...prev.pickaxes, newPickaxe],
        coins: prev.coins - price
      }));

      toast.success(`Bought ${name} for ${price.toLocaleString()} coins!`);
      return true;
    } catch (error: any) {
      console.error('Error buying pickaxe:', error);
      toast.error('Failed to buy pickaxe');
      return false;
    }
  };

  const addClickerEarnings = async (amount: number = 1) => {
    if (!user) return;

    try {
      const newCoins = gameData.coins + amount;
      
      const { error } = await supabase
        .from('game_state')
        .update({ coins: newCoins })
        .eq('user_id', user.id);

      if (error) throw error;

      setGameData(prev => ({
        ...prev,
        coins: newCoins
      }));
    } catch (error: any) {
      console.error('Error updating coins from clicker:', error);
      toast.error('Failed to update coins');
    }
  };

  const clearUsedPickaxes = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pickaxes')
        .delete()
        .eq('user_id', user.id)
        .eq('used', true);

      if (error) throw error;

      setGameData(prev => ({
        ...prev,
        pickaxes: prev.pickaxes.filter(p => !p.used)
      }));

      toast.success('Deleted all used pickaxes');
      return true;
    } catch (error: any) {
      console.error('Error deleting used pickaxes:', error);
      toast.error('Failed to delete used pickaxes');
      return false;
    }
  };

  return {
    ...gameData,
    saveCrystal,
    usePickaxe,
    sellCrystal,
    buyPickaxe,
    addClickerEarnings,
    clearUsedPickaxes,
    refreshData: loadGameData
  };
}