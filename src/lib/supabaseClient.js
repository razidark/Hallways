import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Live binding: flipped to true at boot if the backend cannot be reached, so the
// app degrades to local mock data instead of rendering a broken/empty feed.
export let isOfflineDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

if (isOfflineDemoMode) {
  console.warn('⚡ Hallways is running in Offline Demo Mode. Using local mock fallbacks.');
}

// Create client with fallback dummy parameters if missing to prevent initialization throws
const validUrl = !isOfflineDemoMode ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = !isOfflineDemoMode ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(validUrl, validKey);

const HEALTH_TIMEOUT_MS = 6000;

/**
 * Pings the Supabase REST API to check whether the backend is actually reachable.
 * A configured-but-dead project (paused, deleted, DNS failure) must not leave the
 * user staring at an empty feed, so this flips the app into demo mode instead.
 */
export async function checkBackendHealth() {
  if (isOfflineDemoMode) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Health check failed with HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.warn('⚡ Supabase backend unreachable — switching to Offline Demo Mode.', err.message);
    isOfflineDemoMode = true;
    return false;
  } finally {
    clearTimeout(timer);
  }
}
