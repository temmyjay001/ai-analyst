// app/page.tsx - Landing Page
"use client";

import { useState } from "react";
import {
  ArrowRight,
  Database,
  MessageCircle,
  BarChart3,
  Check,
  Menu,
  X,
  Star,
  Zap,
  Shield,
  Mail,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  Dbstuff.ai
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a
                  href="#features"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Pricing
                </a>
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

            {/* Mobile menu button */}
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

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-800">
                <a
                  href="#features"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                >
                  Pricing
                </a>
                <Link
                  href="/auth/signin"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 block px-3 py-2 rounded-lg text-base font-medium transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 mb-8">
              <Zap className="h-4 w-4 mr-2" />
              Built for startups & growing companies
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Turn your database into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                insights with AI
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Smart database analytics that speaks your language. No SQL
              required. Get answers to your business questions in seconds, not
              hours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/auth/signup"
                className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Start Free - No Credit Card Required
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join 100+ startups getting faster insights from their data
            </p>
          </div>
        </div>
      </section>

      {/* Demo Screenshot */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl transform rotate-1"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Demo Screenshot/Video Placeholder
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    &quot;Show me our top customers this month&quot; → Instant
                    chart & insights
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to analyze your data
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Connect your database, ask questions in plain English, and get
              instant visualizations and insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Natural Language Queries
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ask questions like &quot;Show me sales by region this
                month&quot; and get instant answers. No SQL knowledge required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Instant Visualizations
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI automatically creates the perfect chart for your data. Bar
                charts, line graphs, pie charts - all generated instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Secure & Fast
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your database credentials are encrypted and secure. Get answers
                in seconds with our optimized AI models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ultra-competitive pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free, upgrade when you need more. 64% cheaper than
              competitors.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Free
                </h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  $0
                  <span className="text-lg font-normal text-gray-500">
                    /month
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Perfect for trying out
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    3 queries per day
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    1 database connection
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    7-day query history
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Basic visualizations
                  </span>
                </li>
              </ul>

              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Get Started Free
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 border-2 border-emerald-400 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  $9
                  <span className="text-lg font-normal text-emerald-100">
                    /month
                  </span>
                </div>
                <p className="text-emerald-100">Or $94/year (save 13%)</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white font-medium">
                    50 queries per day
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">3 database connections</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">30-day query history</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Advanced visualizations</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Priority email support</span>
                </li>
              </ul>

              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 px-6 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-bold"
              >
                Start 14-Day Trial
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Growth
                </h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  $39
                  <span className="text-lg font-normal text-gray-500">
                    /month
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Or $408/year (save 13%)
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    300 queries per day
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    10 database connections
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    90-day query history
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Team collaboration (25 members)
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Dashboard creation
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Live chat support
                  </span>
                </li>
              </ul>

              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Need unlimited queries and dedicated support?
            </p>
            <a
              href="mailto:sales@dbstuff.ai?subject=Enterprise Plan Inquiry"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <Mail className="h-5 w-5" />
              Contact Sales for Enterprise
            </a>
          </div>

          {/* Comparison badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
              <Zap className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                64% cheaper than competitors like Outerbase ($25/mo) and NLSQL
                ($29/mo)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to turn your data into insights?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join startups who are already getting faster insights from their
            databases.
          </p>
          <Link
            href="/auth/signup"
            className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
          >
            Start Free Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">Dbstuff.ai</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Smart database analytics that speaks your language. Turn your
                database into insights with AI - no SQL required.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Dbstuff.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
