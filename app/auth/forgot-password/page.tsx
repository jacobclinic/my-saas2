"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900">Check Your Email</h1>
            <p className="text-neutral-600">
              We've sent you instructions to reset your password. Please check your email.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/auth/sign-in"
              className="text-primary-blue-600 hover:text-primary-blue-700 font-medium inline-flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
          <p className="text-neutral-600">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                required
                className="bg-neutral-50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue-600 hover:bg-primary-blue-700 text-white"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/auth/sign-in"
            className="text-primary-blue-600 hover:text-primary-blue-700 font-medium inline-flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}