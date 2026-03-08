

## Plan: Replace Singularity with "Timing Tap" minigame

### Concept
A timing-based minigame where a bar fills up and the player must tap at exactly the right moment — not too early (too short), not too late (too long). The player must do this multiple rounds (e.g. 5-8 rounds depending on crystal rarity). Each round has a "sweet zone" on a filling bar. Tap inside the zone = success. Miss = fail, crystal destroyed.

### Mechanic
- A bar fills from left to right at varying speed
- There's a highlighted "sweet zone" (green segment) on the bar
- Player must click/tap when the indicator is inside the sweet zone
- Multiple rounds required to win (5 for common, up to 8 for legendary)
- Sweet zone gets narrower each round
- Bar speed increases slightly each round
- **Win**: crystal back + 70% coin bonus (same as old Singularity)
- **Lose**: crystal destroyed

### Changes

**1. Rewrite `src/components/temple/Singularity.tsx`**
- Keep the same component name, props interface, and file location
- Replace all 5-phase logic with the new multi-round timing tap mechanic
- Phases: `select` → `playing` (round N) → `result`
- Each round: animated bar fills up, player taps, check if indicator was in zone
- Visual: progress bar with a colored sweet zone, round counter, crystal info
- Update translations (keep en/ru)

**2. Update `src/components/Temple.tsx`**
- Update description text for Singularity to reflect new mechanic ("Tap at the perfect moment" instead of "Survive 5 phases")

No other files need changes — the routing and props are already wired.

