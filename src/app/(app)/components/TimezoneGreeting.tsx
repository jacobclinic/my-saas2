'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface TimezoneGreetingProps {
  userName: string;
}

export default function TimezoneGreeting({ userName }: TimezoneGreetingProps) {
  const [greeting, setGreeting] = useState<{
    text: string;
    icon: typeof Sun;
  } | null>(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting({ text: 'Good morning', icon: Sun });
      } else if (hour < 18) {
        setGreeting({ text: 'Good afternoon', icon: Sun });
      } else {
        setGreeting({ text: 'Good evening', icon: Moon });
      }
    };

    updateGreeting();
    // Update greeting every minute in case the user keeps the page open across time boundaries
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!greeting) {
    // Return a placeholder while loading to prevent layout shift
    return (
      <div className="flex items-center space-x-2">
        <Sun className="h-6 w-6 text-yellow-500" />
        <span>Loading...</span>
      </div>
    );
  }

  const { text, icon: GreetingIcon } = greeting;

  return (
    <div className="flex items-center space-x-2">
      <GreetingIcon className="h-6 w-6 text-yellow-500" />
      <span>{text}, {userName}</span>
    </div>
  );
}