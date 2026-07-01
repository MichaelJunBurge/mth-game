// Supabase client — auth + profiles (and, later, leaderboards / challenges).
// The anon key is PUBLIC by design: it's meant to live in client code, and every
// table is protected by row-level security. The service_role key is the secret
// one and is never used here.
//
// supabase-js is pulled from a CDN as a native ES module (this project has no
// bundler). Only the browser loads this file; the Node test runner never imports
// it, so the http import is fine.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://sdtbzfbzjvrbinslarem.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdGJ6ZmJ6anZyYmluc2xhcmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTEzODksImV4cCI6MjA5ODQyNzM4OX0.Caek6tb2Wo31m9zjsmmi0f6kQ1TX-B57g6INfTBm3R0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
