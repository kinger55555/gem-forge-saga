## Moderator System: Daily Coin Allowance

Instead of giving moderators access to create pickaxe links, moderators simply get a **daily coin budget** (e.g. 2500 coins) they can send to players by creating links. they get discounts for buying instead of just giving coins. 

### How It Works

- Moderator role stored in `app_metadata.role = 'moderator'`
- Moderators see a simplified panel: just a "Send coins to player" form
- Each moderator can send up to **2500 coins per day** total (split across multiple players if they want)
- A `mod_transfers` table tracks how much each moderator has sent today
- Admins retain full powers (unlimited, pickaxe links, etc.)

### Database Changes

1. **New table `mod_transfers**`:
  - `id` (uuid, PK)
  - `mod_user_id` (uuid, NOT NULL) — the moderator
  - `target_user_id` (uuid, NOT NULL) — the recipient
  - `amount` (integer, NOT NULL)
  - `created_at` (timestamptz, default now())
  - RLS: moderators can INSERT and SELECT their own rows
2. **New DB function `send_mod_coins(p_target_email text, p_amount int)**` (SECURITY DEFINER):
  - Checks caller has `app_metadata.role` = `moderator` or `admin`
  - Looks up target user by email from `auth.users`
  - Calculates how much the mod has already sent today (from `mod_transfers`)
  - If `already_sent + p_amount > 2500`, raises exception
  - Adds coins to target's `game_state`
  - Inserts a row into `mod_transfers`
  - Returns success JSON

### Code Changes

1. `**src/utils/linkUtils.ts**` — add `isModerator()` function
2. `**src/types/admin.ts**` — add `ModTransfer` interface
3. `**src/components/AdminPanel.tsx**`:
  - Show panel for moderators too (via `isModerator()`)
  - Moderators see only: "Send coins" form (email input + amount input + send button) and today's remaining allowance
  - No pickaxe links, no "give to self", no "clear crystals" for moderators
  - Call `supabase.rpc('send_mod_coins', ...)` on submit
4. **Edge function `set-admin-role**` — update to accept `role` param (`admin` | `moderator`)

### Moderator UI (simplified)

```text
┌─────────────────────────────┐
│  Модератор-панель           │
│  Осталось сегодня: 1500/2500│
│                             │
   create pickaxe{lvl}
```