import 'server-only';

import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';
import type { Database } from '~/database.types';

import getSupabaseClientKeys from './get-supabase-client-keys';

const createServerSupabaseClient = () => {
  const keys = getSupabaseClientKeys();

  return createServerClient<Database>(keys.url, keys.anonKey, {
    cookies: getCookiesStrategy(),
  });
};

const getSupabaseServerActionClient = (
  params = {
    admin: false,
  },
) => {
  const keys = getSupabaseClientKeys();

  if (params.admin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      throw new Error('Supabase Service Role Key not provided');
    }

    return createServerClient<Database>(keys.url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
      cookies: {}
    });
  }

  return createServerSupabaseClient();
};

function getCookiesStrategy() {
  const cookieStore = cookies();

  return {
    get: (name: string) => {
      try {
        return cookieStore.get(name)?.value;
      } catch (e) {
        console.warn('Cookie get warning:', e);
        return null;
      }
    },
    set: (name: string, value: string, options: any) => {
      try {

        if (process.env.NEXT_RUNTIME === 'nodejs') {
          cookieStore.set({ 
            name, 
            value, 
            ...options,

            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true
          });
        }
      } catch (e) {
        console.error('Cookie set error:', e);
      }
    },
    remove: (name: string, options: any) => {
      try {
        if (process.env.NEXT_RUNTIME === 'nodejs') {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true
          });
        }
      } catch (e) {
        console.error('Cookie remove error:', e);
      }
    },
  };
}

export default getSupabaseServerActionClient;
