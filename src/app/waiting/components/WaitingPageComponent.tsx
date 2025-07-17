'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '~/core/ui/Button';
import configuration from '~/configuration';
import Image from 'next/image';
import useSignOut from '~/core/hooks/use-sign-out';

interface WaitingPageComponentProps {
  userEmail: string;
}

const WaitingPageComponent: React.FC<WaitingPageComponentProps> = ({
  userEmail,
}) => {
  const [emailSent, setEmailSent] = useState(false);

  const router = useRouter();
  const signOut = useSignOut();

  const handleCheckEmail = () => {
    setEmailSent(true);
    // You can add logic here to actually send an email or just show the message
  };

  const handleReturnToLogin = () => {
    signOut();
  };

  return (
    <div
      className={
        'flex min-h-screen flex-col items-center justify-center space-y-4 p-12' +
        ' md:space-y-8 xl:space-y-16' +
        ' animate-in fade-in slide-in-from-top-8 duration-1000' +
        ' bg-gradient-to-br from-primary-800 via-primary-800 to-secondary-600 opacity-90'
      }
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/assets/images/comaaas.png"
            alt="Logo"
            width={120}
            height={120}
            className="w-[95px] sm:w-[105px]"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Profile Under Review
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Thank you for completing your profile with Comma Education. We are
          currently reviewing your account and will get back to you within{' '}
          <span className="font-semibold text-gray-800">24 hours</span>.
        </p>

        {/* What happens next section */}
        <div className="text-left mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            What happens next?
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Account Verification
                </h3>
                <p className="text-gray-600 text-sm">
                  Our team will verify your identity and qualifications
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Email Notification
                </h3>
                <p className="text-gray-600 text-sm">
                  You'll receive an email confirmation within 24 hours
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Start Teaching
                </h3>
                <p className="text-gray-600 text-sm">
                  Once approved, you can access all platform features
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Check Email Button */}
        <div className="mb-6">
          <button
            onClick={handleCheckEmail}
            className={`w-full p-3 rounded-lg text-sm font-medium transition-colors ${
              emailSent
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
            }`}
          >
            <div className="flex items-center justify-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {emailSent ? 'Email Reminder Sent!' : 'Check Your Email'}
            </div>
          </button>
          {!emailSent && (
            <p className="text-xs text-gray-500 mt-2">
              We'll send updates to your registered email address. Please check
              your spam folder if you don't see our email.
            </p>
          )}
          {emailSent && (
            <p className="text-xs text-green-600 mt-2">
              We've sent a reminder to {userEmail}. Please check your inbox and
              spam folder.
            </p>
          )}
        </div>

        {/* Security badges */}
        <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-orange-500 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 1l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-1.74L12 1z" />
            </svg>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-700">Secure</p>
              <p className="text-xs text-gray-500">Your data is protected</p>
            </div>
          </div>
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 12a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-700">Trusted</p>
              <p className="text-xs text-gray-500">Join 1000+ educators</p>
            </div>
          </div>
        </div>

        {/* Return to Login Button */}
        <Button
          onClick={handleReturnToLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Return to Login →
        </Button>
      </div>
    </div>
  );
};

export default WaitingPageComponent;
