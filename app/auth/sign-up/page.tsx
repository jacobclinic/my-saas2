"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Create an Account</h1>
          <p className="text-neutral-600">Sign up to start managing your classes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                className="bg-neutral-50"
              />
            </div>

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

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="bg-neutral-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue-600 hover:bg-primary-blue-700 text-white"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-600">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-primary-blue-600 hover:text-primary-blue-700 font-medium"
            >
              Sign in
            </Link>
          </p>

          <div className="flex items-center justify-center text-xs text-neutral-500">
            <p>
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-primary-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}