'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import If from '~/core/ui/If';
import OAuthProviders from '~/app/auth/components/OAuthProviders';

import EmailPasswordSignInContainer from '~/app/auth/components/EmailPasswordSignInContainer';
import PhoneNumberSignInContainer from '~/app/auth/components/PhoneNumberSignInContainer';
import EmailLinkAuth from '~/app/auth/components/EmailLinkAuth';

import configuration from '~/configuration';
import EmailOtpContainer from '~/app/auth/components/EmailOtpContainer';
import JoinClassSignin from './JoinClassSignin';

function SignInMethodsContainer({
  redirectUrl,
}: {
  redirectUrl: string | null;
}) {
  const router = useRouter();

  const onSignIn = useCallback(() => {
    router.push(configuration.paths.appHome);
  }, [router]);

  return (
    <>
      {redirectUrl?.includes('/sessions/student/') ? (
        <JoinClassSignin />
      ) : (
        <>
          <If condition={configuration.auth.providers.oAuth.length}>
            <OAuthProviders />

            <div>
              <span className={'text-xs text-gray-400'}>
                or continue with email
              </span>
            </div>
          </If>

          <If condition={configuration.auth.providers.emailPassword}>
            <EmailPasswordSignInContainer onSignIn={onSignIn} />
          </If>

          <If condition={configuration.auth.providers.phoneNumber}>
            <PhoneNumberSignInContainer onSuccess={onSignIn} mode={'signIn'} />
          </If>

          <If condition={configuration.auth.providers.emailLink}>
            <EmailLinkAuth />
          </If>

          <If condition={configuration.auth.providers.emailOtp}>
            <EmailOtpContainer shouldCreateUser={false} />
          </If>
        </>
      )}
    </>
  );
}

export default SignInMethodsContainer;
