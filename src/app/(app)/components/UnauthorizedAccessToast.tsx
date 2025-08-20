'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const UnauthorizedAccessToast = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    const role = searchParams.get('role');

    if (message === 'unauthorized' && role) {
      // Show toast notification for unauthorized access
      toast.error(`You don't have access to ${role} sessions. Please contact support if you think this is an error.`);
    }
  }, [searchParams]);

  // This component doesn't render anything visible
  return null;
};

export default UnauthorizedAccessToast;
