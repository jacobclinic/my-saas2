import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Comma Education - Tutor Portal',
  description: 'Online tuition platform for students and tutors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthPage = (typeof window !== 'undefined') 
    ? window.location.pathname.startsWith('/auth')
    : false;

  return (
    <html lang="en">
      <body className={inter.className}>
        {isAuthPage ? (
          <>{children}</>
        ) : (
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 relative">
              <main className="absolute inset-0 overflow-y-auto bg-neutral-50 p-4 lg:p-6">
                {children}
              </main>
            </div>
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}