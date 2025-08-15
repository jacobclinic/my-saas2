'use client';

import React, { forwardRef, useState } from 'react';
import classNames from 'clsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInputComponent({ className, ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={classNames(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          onClick={togglePasswordVisibility}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <EyeIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

export default PasswordInput;