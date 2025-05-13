'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '~/app/(app)/lib/hooks/use-toast';

const UnauthorizedAccessToast = () => {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const message = searchParams.get('message');
    const role = searchParams.get('role');

    if (message === 'unauthorized' && role) {
      // Show toast notification for unauthorized access
      toast({
        title: 'Access Restricted',
        description: `You don't have access to ${role} sessions. Please contact support if you think this is an error.`,
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // This component doesn't render anything visible
  return null;
};

export default UnauthorizedAccessToast;
