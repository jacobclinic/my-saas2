'use client';

import React from 'react';
import classNames from 'clsx';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

import Button from '~/core/ui/Button';
import isBrowser from '~/core/generic/is-browser';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createCheckoutAction } from '~/lib/stripe/actions';

const CheckoutRedirectButton: React.FCC<{
  disabled?: boolean;
  stripePriceId?: string;
  recommended?: boolean;
  customerId: Maybe<string>;
}> = ({ children, ...props }) => {
  return (
    <form data-cy={'checkout-form'} action={createCheckoutAction}>
      <CheckoutFormData
        customerId={props.customerId}
        priceId={props.stripePriceId}
      />

      <Button
        block
        className={classNames({
          'text-primary-foreground bg-primary dark:bg-white dark:text-gray-900':
            props.recommended,
        })}
        variant={props.recommended ? 'custom' : 'outline'}
        disabled={props.disabled}
      >
        <span className={'flex items-center space-x-2'}>
          <span>{children}</span>

          <ChevronRightIcon className={'h-4'} />
        </span>
      </Button>
    </form>
  );
};

export default CheckoutRedirectButton;

function CheckoutFormData(
  props: React.PropsWithChildren<{
    priceId: Maybe<string>;
    customerId: Maybe<string>;
  }>,
) {
  const csrfToken = useCsrfToken();

  return (
    <>
      <input type="hidden" name={'csrfToken'} defaultValue={csrfToken} />
      <input type="hidden" name={'returnUrl'} defaultValue={getReturnUrl()} />
      <input type="hidden" name={'priceId'} defaultValue={props.priceId} />

      <input
        type="hidden"
        name={'customerId'}
        defaultValue={props.customerId}
      />
    </>
  );
}

function getReturnUrl() {
  return isBrowser()
    ? [window.location.origin, window.location.pathname].join('')
    : undefined;
}
