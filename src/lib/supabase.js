import { createClient } from "@supabase/supabase-js";

/*  Supabase connection
    ────────────────────
    Set these in a local `.env` file (see `.env.example`) and as repo
    "Actions" secrets / Pages env vars for the deployed build:

      VITE_SUPABASE_URL=https://xxxx.supabase.co
      VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

    The anon key is safe to ship in the client — row-level security on the
    `bookings` table (see supabase/schema.sql) is what actually protects the
    data: the public can only INSERT bookings, and only a signed-in admin can
    read them.                                                              */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;
