// components/PublicNav.tsx
"use client";

import { useState } from "react";
import { Database, Menu, X } from "lucide-react";
import Link from "next/link";

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                WhoPrompt
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/#features"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/#faq"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/docs"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/about"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/auth/signin"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Start Free
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/#features"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/#faq"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/docs"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <Link
                href="/about"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/auth/signin"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-emerald-600 text-white hover:bg-emerald-700 block px-3 py-2 rounded-lg text-base font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
