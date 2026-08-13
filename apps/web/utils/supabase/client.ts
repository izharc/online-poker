import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
}

// This only initializes the browser client; it does not make a network request.
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

/** A safe initialization check for development and integration verification. */
export const isSupabaseClientInitialized = Boolean(supabase);
