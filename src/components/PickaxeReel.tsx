import { useEffect, useRef, useState } from 'react';
import { PickaxeCaseTile } from './PickaxeCaseTile';
import { generatePickaxeReelData, getRarityFromPickaxe } from '@/utils/pickaxeUtils';

interface PickaxeReelProps {
  winningPickaxe: string;
  onSpinComplete: (pickaxe: string) => void;
  isSpinning: boolean;
}

export function PickaxeReel({ winningPickaxe, onSpinComplete, isSpinning }: PickaxeReelProps) {
  const reelRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const [reelData, setReelData] = useState<string[]>([]);
  const [winningIndex, setWinningIndex] = useState<number>(0);
  const [showGoldSweep, setShowGoldSweep] = useState(false);
  
  // Generate reel data when component mounts or when spinning starts
  useEffect(() => {
    if (isSpinning) {
      // Generate enough tiles for 6-8 full loops plus winning position
      const tilesPerLoop = 15; // One of each pickaxe type
      const totalLoops = 7;
      const reel = generatePickaxeReelData(tilesPerLoop * totalLoops + 20);
      
      // Place winning pickaxe at a specific position near the end
      const winIndex = reel.length - 10;
      reel[winIndex] = winningPickaxe;
      
      setReelData(reel);
      setWinningIndex(winIndex);
      setShowGoldSweep(false);
    }
  }, [isSpinning, winningPickaxe]);

  // Handle spin animation with CS2-style behavior
  useEffect(() => {
    if (!isSpinning || !reelRef.current || reelData.length === 0) return;

    const reel = reelRef.current;
    const pointer = pointerRef.current;
    const tileWidth = 144; // w-32 + gap
    const isLegendary = getRarityFromPickaxe(winningPickaxe) === 'legendary';
    
    // Animation duration 5.5-6.5s for more dramatic effect
    const duration = 5500 + Math.random() * 1000;
    
    // Calculate positions for pixel-perfect centering
    const containerWidth = reel.parentElement?.offsetWidth || 800;
    const startX = containerWidth / 2; // Start centered
    const endX = -(winningIndex * tileWidth - containerWidth / 2 + tileWidth / 2);
    
    // Reset to start position
    reel.style.transform = `translateX(${startX}px)`;
    reel.style.transition = 'none';
    
    // Force reflow
    reel.offsetHeight;
    
    // Tick sound simulation with timing
    let tickCount = 0;
    const totalTicks = Math.floor(duration / 50); // Start with fast ticks
    const tickInterval = setInterval(() => {
      tickCount++;
      const progress = tickCount / totalTicks;
      
      // Slow down ticks more dramatically as we approach the end
      if (progress > 0.7) {
        if (tickCount % 4 !== 0) return; // Skip more ticks to slow down earlier
      } else if (progress > 0.9) {
        if (tickCount % 6 !== 0) return; // Even slower near the very end
      }
      
      // Play tick sound (would be actual audio in real implementation)
      console.log(`Tick ${tickCount} - Speed: ${progress > 0.8 ? 'slow' : 'fast'}`);
      
      if (tickCount >= totalTicks) {
        clearInterval(tickInterval);
      }
    }, 50);
    
    // Start CS2-style easing animation
    setTimeout(() => {
      reel.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.05, 0.98)`;
      reel.style.transform = `translateX(${endX}px)`;
      
      // Complete after animation
      setTimeout(() => {
        clearInterval(tickInterval);
        
        // Flash pointer
        if (pointer) {
          pointer.style.animation = 'flash 0.3s ease-in-out 2';
        }
        
        // Play landing sound
        console.log(isLegendary ? 'Legendary landing chime!' : 'Normal landing ping');
        
        // Show gold sweep for legendary
        if (isLegendary) {
          setShowGoldSweep(true);
          setTimeout(() => setShowGoldSweep(false), 1500);
        }
        
        setTimeout(() => {
          onSpinComplete(winningPickaxe);
        }, 500);
      }, duration);
    }, 100);
  }, [isSpinning, reelData, winningIndex, winningPickaxe, onSpinComplete]);

  return (
    <div className="relative w-full h-48 overflow-hidden bg-card/30 rounded-lg border-2 border-border">
      {/* Gold sweep overlay for legendary */}
      {showGoldSweep && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rarity-legendary/30 to-transparent animate-[sweep_1.5s_ease-out] z-20" />
      )}
      
      {/* Center pointer line */}
      <div 
        ref={pointerRef}
        className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary/80 z-10 transform -translate-x-1/2"
      >
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