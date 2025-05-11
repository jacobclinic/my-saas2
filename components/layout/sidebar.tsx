"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SETTINGS_LINKS } from "@/lib/constants";
import {
  LayoutDashboard,
  Folder, // Replace FolderKanban with Folder
  CalendarClock,
  CalendarCheck2,
  Wallet,
  User,
  CreditCard,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const icons = {
  LayoutDashboard,
  FolderKanban: Folder, // Map FolderKanban to Folder
  CalendarClock,
  CalendarCheck2,
  Wallet,
  User,
  CreditCard,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    // Add sign out logic here
    router.push("/auth/sign-in");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:transform-none",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex-shrink-0 px-6 py-6 border-b border-neutral-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Comma Education Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-neutral-900">
              Comma Education
            </span>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => {
                const Icon = icons[link.icon as keyof typeof icons];
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "sidebar-link",
                      isActive ? "sidebar-link-active" : "sidebar-link-inactive"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {Icon && <Icon size={20} />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8">
              <div
                className="flex items-center justify-between px-3 py-2 text-sm font-medium text-neutral-500 cursor-pointer"
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              >
                <span>SETTINGS</span>
                <ChevronRight
                  size={16}
                  className={cn(
                    "transition-transform duration-200",
                    isSettingsExpanded && "transform rotate-90"
                  )}
                />
              </div>

              {isSettingsExpanded && (
                <div className="mt-1 space-y-1 pl-2">
                  {SETTINGS_LINKS.map((link) => {
                    const Icon = icons[link.icon as keyof typeof icons];
                    const isActive = pathname === link.href;

                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                          "sidebar-link",
                          isActive
                            ? "sidebar-link-active"
                            : "sidebar-link-inactive"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {Icon && <Icon size={20} />}
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* User Profile Section - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-neutral-200 bg-white">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-blue-100 text-primary-blue-600 font-medium">
                YP
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  Yasith Prabuddhaka
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  yasithph42@gmail.com
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-neutral-600 hover:text-error hover:bg-error-light/10"
              onClick={handleSignOut}
            >
              <LogOut size={18} className="mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
