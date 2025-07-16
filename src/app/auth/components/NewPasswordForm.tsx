'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import Alert from '~/core/ui/Alert';
import If from '~/core/ui/If';
import { updatePasswordAction } from '../new-password/actions';

interface UrlParams {
  token_hash: string | null;
  type: string | null;
}

// Utility to extract URL parameters from query string
const getUrlParams = (): UrlParams => {
  if (typeof window === 'undefined') {
    return { token_hash: null, type: null };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    token_hash: params.get('token_hash'),
    type: params.get('type'),
  };
};

interface NewPasswordFormProps {
  onSuccess?: () => void;
}

export default function NewPasswordForm({ onSuccess }: NewPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlParams, setUrlParams] = useState<UrlParams>({
    token_hash: null,
    type: null,
  });

  const router = useRouter();

  useEffect(() => {
    // Extract URL parameters on client side
    const params = getUrlParams();
    setUrlParams(params);

    // Validate that we have the required recovery parameters
    if (!params.token_hash || params.type !== 'recovery') {
      setError('Invalid or expired reset link');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!urlParams.token_hash || urlParams.type !== 'recovery') {
      setError('Invalid or expired reset link');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('token_hash', urlParams.token_hash);

      const result = await updatePasswordAction(formData);

      if (result.success) {
        setSuccess(true);
        onSuccess?.();
        // Redirect to sign-in page after a delay
        setTimeout(() => {
          router.push('/auth/sign-in?message=Password updated successfully');
        }, 2000);
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert type="success">
        <div className="text-center">
          <p className="font-medium">Password Updated Successfully!</p>
          <p className="text-sm mt-1">Redirecting to sign-in page...</p>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <TextField>
          <TextField.Label>New Password</TextField.Label>

          <TextField.Input
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            minLength={6}
            disabled={loading}
          />
        </TextField>

        <TextField>
          <TextField.Label>Confirm New Password</TextField.Label>

          <TextField.Input
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword((e.target as HTMLInputElement).value)
            }
            required
            minLength={6}
            disabled={loading}
          />
        </TextField>
      </div>

      <If condition={!!error}>
        <Alert type="error">{error}</Alert>
      </If>

      <Button
        type="submit"
        loading={loading}
        disabled={loading || !urlParams.token_hash}
        className="w-full"
      >
        <span>Update Password</span>
      </Button>

      <If condition={!urlParams.token_hash && urlParams.type !== 'recovery'}>
        <Alert type="warn">
          <div className="text-center">
            <p>Missing recovery tokens. Please use the link from your email.</p>
          </div>
        </Alert>
      </If>
    </form>
  );
}
