'use client';

import { useEffect, useState } from 'react';
import { getUserTimezone } from '~/lib/utils/timezone-utils';
import { Clock } from 'lucide-react';

interface TimezoneIndicatorProps {
  className?: string;
  showIcon?: boolean;
}

const TimezoneIndicator = ({
  className = '',
  showIcon = true,
}: TimezoneIndicatorProps) => {
  const [timezone, setTimezone] = useState<string>('');
  const [formattedTimezone, setFormattedTimezone] = useState<string>('');

  useEffect(() => {
    // Get the timezone from the browser
    const userTimezone = getUserTimezone();
    setTimezone(userTimezone);

    // Format the timezone to be more readable
    try {
      // Get timezone abbreviation and offset
      const now = new Date();
      const timezoneAbbr = now
        .toLocaleString('en-US', { timeZoneName: 'short' })
        .split(' ')
        .pop();

      // Get offset in hours:minutes format
      const offset = -now.getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const sign = offset >= 0 ? '+' : '-';
      //const formattedOffset = `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      setFormattedTimezone(`${timezoneAbbr}`);
    } catch (error) {
      console.error('Error formatting timezone:', error);
      setFormattedTimezone(userTimezone); // Fallback to raw timezone id
    }
  }, []);

  if (!timezone) return null;

  return (
    <div
      className={`flex items-center text-sm text-gray-600 dark:text-gray-300 ${className}`}
    >
      {showIcon && <Clock className="h-3 w-3 mr-1.5" />}
      <span>Timezone: {formattedTimezone}</span>
    </div>
  );
};

export default TimezoneIndicator;
