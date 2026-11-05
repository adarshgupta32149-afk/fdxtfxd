import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * The Supabase client, or null when the app is built without backend settings.
 * Everything still works offline in that case; accounts and leaderboards are hidden.
 */
export const supabase: SupabaseClient<Database> | null =
  url && key
    ? createClient<Database>(url, key, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// On phones, only refresh the login token while the app is open (Supabase's recommended setup).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    if (status === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Turns Supabase auth errors into messages a user can act on. */
export function friendlyAuthError(error: { code?: string; message: string; status?: number }): string {
  switch (error.code) {
    case 'email_address_not_authorized':
      return "Sign-in emails can't be sent to this address yet. During testing, only the app team's email addresses work.";
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many codes requested. Wait a few minutes and try again.';
    case 'otp_expired':
      return 'That code has expired or is wrong. Request a new one.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'That email address looks wrong.';
  }
  if (error.status === 429) return 'Too many attempts. Wait a few minutes and try again.';
  if (/network|fetch/i.test(error.message)) return "Couldn't reach the server. Check your internet connection.";
  return error.message;
}
