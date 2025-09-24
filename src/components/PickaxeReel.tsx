import { useEffect, useRef, useState } from 'react';
import { PickaxeCaseTile } from './PickaxeCaseTile';
import { generatePickaxeReelData } from '@/utils/pickaxeUtils';

interface PickaxeReelProps {
  winningPickaxe: string;
  onSpinComplete: (pickaxe: string) => void;
  isSpinning: boolean;
}

export function PickaxeReel({ winningPickaxe, onSpinComplete, isSpinning }: PickaxeReelProps) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [reelData, setReelData] = useState<string[]>([]);
  const [winningIndex, setWinningIndex] = useState<number>(0);
  
  // Generate reel data when component mounts or when spinning starts
  useEffect(() => {
    if (isSpinning) {
      // Generate a reel with the winning pickaxe at a specific position
      const reel = generatePickaxeReelData(50);
      const centerIndex = Math.floor(reel.length / 2);
      
      // Place winning pickaxe in the center
      reel[centerIndex] = winningPickaxe;
      
      setReelData(reel);
      setWinningIndex(centerIndex);
    }
  }, [isSpinning, winningPickaxe]);

  // Handle spin animation
  useEffect(() => {
    if (!isSpinning || !reelRef.current || reelData.length === 0) return;

    const reel = reelRef.current;
    const tileWidth = 144; // 32 (w-32) * 4 (px per rem) + gap
    const totalWidth = reelData.length * tileWidth;
    
    // Start position (show first few tiles)
    const startX = 0;
    
    // End position (center the winning tile)
    const endX = -(winningIndex * tileWidth - (reel.offsetWidth / 2) + (tileWidth / 2));
    
    // Reset to start position
    reel.style.transform = `translateX(${startX}px)`;
    reel.style.transition = 'none';
    
    // Force reflow
    reel.offsetHeight;
    
    // Start animation after a short delay
    setTimeout(() => {
      reel.style.transition = 'transform 6.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
      reel.style.transform = `translateX(${endX}px)`;
      
      // Complete after animation
      setTimeout(() => {
        onSpinComplete(winningPickaxe);
      }, 6500);
    }, 100);
  }, [isSpinning, reelData, winningIndex, winningPickaxe, onSpinComplete]);

  return (
    <div className="relative w-full h-48 overflow-hidden bg-card/30 rounded-lg border-2 border-border">
      {/* Center pointer line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary/80 z-10 transform -translate-x-1/2">
        <div className="absolute top-1/2 left-1/2 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-primary transform -translate-x-1/2 -translate-y-3" />
        <div className="absolute bottom-1/2 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-primary transform -translate-x-1/2 translate-y-3" />
      </div>
      
      {/* Reel container */}
      <div 
        ref={reelRef}
        className="absolute top-1/2 transform -translate-y-1/2 flex gap-4 p-4"
      >
        {reelData.map((pickaxeKey, index) => (
          <PickaxeCaseTile 
            key={`${pickaxeKey}-${index}`}
            pickaxeKey={pickaxeKey}
            isWinning={!isSpinning && index === winningIndex}
          />
        ))}
      </div>
    </div>
  );
}