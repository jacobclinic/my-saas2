'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import configuration from '~/configuration';
import { useForm } from 'react-hook-form';
import useSignInWithEmailPassword from '~/core/hooks/use-sign-in-with-email-password';

function JoinClassSignin() {
  // Get the query parameters
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl');
  // Decode and extract parameters
  const decodedUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '';

  const sessionParams = {
    sessionId: decodedUrl.match(/sessionId=([^&]+)/)?.[1],
    className: decodedUrl.match(/className=([^&]+)/)?.[1],
    sessionDate: decodedUrl.match(/sessionDate=([^&]+)/)?.[1],
    sessionTime: decodedUrl.match(/sessionTime=([^&]+)/)?.[1],
    sessionSubject: decodedUrl.match(/sessionSubject=([^&]+)/)?.[1],
    sessionTitle: decodedUrl.match(/sessionTitle=([^&]+)/)?.[1],
  };

  const signInMutation = useSignInWithEmailPassword();
  const isLoading = signInMutation.isMutating;

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = useCallback(
    async (params: { email: string; password: string }) => {
      try {
        const data = await signInMutation.trigger(params);
        const userId = data?.user?.id;

        // On successful sign-in, redirect redirectUrl
        router.push(
          `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionParams.sessionId}?type=upcoming`,
        );
      } catch (error) {
        console.error('Sign in error:', error);
      }
    },
    [router],
  );

  return (
    <div className="w-full mx-auto p-5 font-sans border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between">
        <h2 className="text-center text-2xl font-semibold text-gray-800 flex justify-start mb-0">
          <b>Join Class</b>
        </h2>
        <div className="bg-amber-100 h-6 border rounded-md pl-2 pr-2">
          <p className="text-amber-700 text-sm bold">
            <b>Starting soon</b>
          </p>
        </div>
      </div>
      <p className="text-center text-sm text-gray-600 mb-3 flex justify-start">
        Enter your login details to join
      </p>
      {/* Display session details if available */}
      {!sessionParams.sessionId &&
      !sessionParams.className &&
      !sessionParams.sessionDate &&
      !sessionParams.sessionTime &&
      !sessionParams.sessionSubject &&
      !sessionParams.sessionTitle ? (
        null
      ) : (
        <div className="bg-gray-50 p-4 rounded-md border border-blue-500 mb-6">
          <h3 className="text-base font-medium text-blue-900 mb-2">
            {sessionParams.className && <b>{sessionParams.className}</b>}
          </h3>
          {sessionParams.sessionDate && (
            <p className="text-sm text-blue-800 mb-1">
              {sessionParams.sessionDate} · {sessionParams.sessionTime}
            </p>
          )}

          {sessionParams.sessionSubject && (
            <p className="text-sm text-blue-800">
              Subject: {sessionParams.sessionSubject}
            </p>
          )}
          {sessionParams.sessionTitle != 'undefined' ||
            (sessionParams.sessionTitle && (
              <p className="text-sm text-blue-800">
                Title: {sessionParams.sessionTitle}
              </p>
            ))}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <input
            type="email" // Changed to email type for proper validation
            id="email" // Changed to match the form field name
            placeholder="Enter email" // Changed to reflect email input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-6">
          <input
            type="password"
            id="password"
            placeholder="Enter password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 mb-4"
          type="submit"
        >
          Join Class
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Having trouble joining? Contact support at{' '}
        <a
          href="mailto:support@commaeducation.com"
          className="text-blue-600 hover:underline"
        >
          support@commaeducation.com
        </a>
      </p>
    </div>
  );
}

export default JoinClassSignin;
