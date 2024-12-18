'use server';

import { revalidatePath } from 'next/cache';
import { createSession, createSessions, deleteSession, updateSession } from '~/lib/sessions/database/mutations';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import SessionsType from './types/session';

type CreateSessionParams = {
  sessionData: Omit<SessionsType, 'id'>;
  csrfToken: string;
};

type CreateSessionsParams = {
  sessionsData: Omit<SessionsType, 'id'>[];
  csrfToken: string;
};

type UpdateSessionParams = {
  sessionId: string;
  sessionData: Partial<Omit<SessionsType, 'id'>>;
  csrfToken: string;
};

type DeleteSessionParams = {
  sessionId: string;
  csrfToken: string;
};

export const createSessionAction = withSession(
  async (params: CreateSessionParams) => {
    const client = getSupabaseServerActionClient();

    const result = await createSession(client, params.sessionData);

    revalidatePath('/sessions');
    revalidatePath('/(app)/sessions');
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      session: result,
    };
  },
);

export const createSessionsAction = withSession(
  async (params: CreateSessionsParams) => {
    const client = getSupabaseServerActionClient();

    const result = await createSessions(client, params.sessionsData);

    // Revalidate paths to update any dependent pages or data
    revalidatePath('/sessions');
    revalidatePath('/(app)/sessions');
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');

    return {
      success: true,
      sessions: result,
    };
  },
);

export const updateSessionAction = withSession(
  async (params: UpdateSessionParams) => {
    const client = getSupabaseServerActionClient();

    const result = await updateSession(client, params.sessionId, params.sessionData);

    revalidatePath('/sessions');
    revalidatePath(`/sessions/${result?.id}`);
    revalidatePath('/(app)/sessions');
    revalidatePath(`/(app)/sessions/${result?.id}`);
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      session: result,
    };
  }
);

export const deleteSessionAction = withSession(
  async (params: DeleteSessionParams) => {
    const client = getSupabaseServerActionClient();

    const result = await deleteSession(client, params.sessionId);

    revalidatePath('/sessions');
    revalidatePath('/(app)/sessions');
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      sessionId: result,
    };
  }
);