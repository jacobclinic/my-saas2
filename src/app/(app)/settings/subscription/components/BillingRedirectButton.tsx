'use client';

import { ArrowUpRightIcon } from '@heroicons/react/24/outline';

import Button from '~/core/ui/Button';
import { createBillingPortalSessionAction } from '~/lib/stripe/actions';

const BillingPortalRedirectButton: React.FCC<{
  customerId: string;
  className?: string;
}> = ({ children, customerId, className }) => {
  return (
    <form action={createBillingPortalSessionAction}>
      <input type={'hidden'} name={'customerId'} value={customerId} />

      <Button variant={'outline'} className={className}>
        <span className={'flex items-center space-x-2'}>
          <span>{children}</span>

          <ArrowUpRightIcon className={'h-3'} />
        </span>
      </Button>
    </form>
  );
};

export default BillingPortalRedirectButton;
