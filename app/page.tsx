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
  Zap,
  Shield,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Mail,
  Globe,
  LayoutDashboard,
  Pin,
  RefreshCw,
  Grid3x3,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: MessageCircle,
      title: "Natural Language Queries",
      description:
        "Ask questions in plain English. No SQL knowledge required. Our AI understands your intent and generates optimized queries instantly.",
      badge: null,
    },
    {
      icon: LayoutDashboard,
      title: "Custom Dashboards",
      description:
        "Create unlimited dashboards and pin your most important charts. Organize insights by team, project, or metric with grid or list views.",
      badge: "NEW",
    },
    {
      icon: Sparkles,
      title: "Deep Analysis",
      description:
        "Go beyond surface-level insights. Automatically asks 3 intelligent follow-up questions to uncover hidden patterns and actionable trends.",
      badge: "GROWTH+",
    },
    {
      icon: BarChart3,
      title: "Instant Visualizations",
      description:
        "Get beautiful, interactive charts automatically generated from your query results. Download as PNG or pin to dashboards with one click.",
      badge: null,
    },
    {
      icon: Database,
      title: "Multi-Database Support",
      description:
        "Connect to PostgreSQL, MySQL, SQL Server, and SQLite. Switch between databases seamlessly in one unified interface.",
      badge: null,
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description:
        "Your credentials are encrypted with AES-256-GCM. SSL connections supported. Read-only queries ensure your data stays safe.",
      badge: null,
    },
  ];

  const faqs = [
    {
      question: "How does the AI understand my questions?",
      answer:
        "We use Google's Gemini AI to understand your natural language questions and convert them into optimized SQL queries. The AI is trained on database schemas and can interpret complex business questions, generating accurate queries even for intricate multi-table joins.",
    },
    {
      question: "What are Custom Dashboards?",
      answer:
        "Custom Dashboards let you organize and monitor your most important metrics in one place. Pin charts from any query, create multiple dashboards for different teams or projects, refresh data with one click, and switch between grid or list view. Available on Starter plans and above.",
    },
    {
      question: "Is my database data secure?",
      answer:
        "Absolutely. Your database credentials are encrypted using AES-256-GCM encryption before storage. We support SSL connections for secure data transmission. All queries are read-only by default (only SELECT allowed), and we never store your actual business data - only query results temporarily for visualization.",
    },
    {
      question: "What is Deep Analysis?",
      answer:
        "Deep Analysis is our advanced feature (available on Growth+ plans) that goes beyond answering your initial question. After running your query, our AI automatically generates and executes 3 intelligent follow-up queries to uncover trends, patterns, and insights you might have missed. It's like having a data analyst working alongside you.",
    },
    {
      question: "Which databases do you support?",
      answer:
        "We currently support PostgreSQL, MySQL, Microsoft SQL Server, and SQLite. Each database has full support for its specific SQL dialect and features. You can connect multiple databases and switch between them seamlessly.",
    },
    {
      question: "Can I export my query results and charts?",
      answer:
        "Yes! You can export query results to JSON format and download charts as high-resolution PNG images. You can also pin charts to custom dashboards for ongoing monitoring. All exports include metadata like the SQL query, execution time, and AI interpretations.",
    },
    {
      question: "What happens when I hit my query limit?",
      answer:
        "Each plan has a daily query limit (Free: 3/day, Starter: 50/day, Growth: 300/day). Once you hit the limit, you'll be prompted to upgrade or wait until the next day when your quota resets. Deep Analysis uses 3 queries per execution. Dashboard refreshes also count toward your daily limit. Enterprise plans have unlimited queries.",
    },
    {
      question: "How accurate are the SQL queries generated?",
      answer:
        "Our AI achieves high accuracy by understanding your complete database schema, including tables, columns, data types, and relationships. For complex queries, we recommend reviewing the generated SQL (which is always shown) before execution. You can also refine queries through follow-up questions.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
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
                <a
                  href="#faq"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  FAQ
                </a>
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
                <a
                  href="#features"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </a>
                <Link
                  href="/docs"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                >
                  Docs
                </Link>
                <Link
                  href="/about"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white block px-3 py-2 text-base font-medium"
                >
                  Contact
                </Link>
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
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 mb-8">
              <Zap className="h-4 w-4 mr-2" />
              Built for startups & growing companies
            </div>

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

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join 100+ startups getting faster insights from their data
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Feature Spotlight */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white mb-6">
                <Zap className="h-3 w-3 mr-1" />
                NEW FEATURE
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Build Custom Dashboards
                <span className="block text-emerald-600 dark:text-emerald-400 mt-2">
                  in Seconds
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Stop switching between queries. Pin your most important charts
                to custom dashboards and monitor everything that matters in one
                place.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start group">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/70 transition-colors">
                      <Pin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Pin Any Chart
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      One-click pinning from any query result. Organize by team,
                      project, or metric.
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                      <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Refresh with One Click
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Keep your dashboards up-to-date. Refresh individual charts
                      or entire dashboards instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/70 transition-colors">
                      <Grid3x3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Multiple View Modes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Switch between grid and list views. Customize your layout
                      for optimal monitoring.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/auth/signup"
                className="inline-flex items-center bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Start Building Dashboards
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Right Column - Dashboard Preview Mockup */}
            <div className="relative">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-600 dark:to-cyan-600 rounded-2xl transform rotate-3 opacity-10 dark:opacity-20 blur-xl"></div>

              {/* Main dashboard card */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Sales Dashboard
                    </span>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      4 charts
                    </span>
                  </div>
                  {/* Mac-style window buttons */}
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>

                {/* Mockup Grid - 2x2 chart grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all hover:shadow-md"
                    >
                      {/* Chart header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                        <BarChart3 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>

                      {/* Chart visualization mockup */}
                      <div className="space-y-2">
                        <div className="h-16 bg-gradient-to-t from-emerald-200 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded border border-emerald-300 dark:border-emerald-700/50"></div>
                        <div className="h-2 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dashboard footer with action hint */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Last updated: 2 mins ago</span>
                  <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                    Refresh all →
                  </button>
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
              From natural language queries to custom dashboards - all in one
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 relative"
              >
                {feature.badge && (
                  <div className="absolute -top-3 -right-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        feature.badge === "NEW"
                          ? "bg-emerald-600 text-white"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      }`}
                    >
                      {feature.badge}
                    </span>
                  </div>
                )}
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need more. No surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Free
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    3 queries/day
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    1 connection
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    7-day history
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Community support
                  </span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full text-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Starter Plan - Most Popular */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-emerald-600 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Starter
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $9
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    50 queries/day
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    3 connections
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    30-day history
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Email support
                  </span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full text-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Growth
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $39
                </span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    300 queries/day
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    10 connections
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong>Deep Analysis</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    90-day history
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Priority support
                  </span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="block w-full text-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Need unlimited queries and connections?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Contact us for Enterprise pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about WhoPrompt
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-8">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform flex-shrink-0 ${
                      openFaq === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to unlock your data&apos;s potential?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join hundreds of companies using AI to make better data-driven
            decisions
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Start Free Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">
                  WhoPrompt
                </span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered database analytics for modern teams
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
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
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:hello@whoprompt.com"
                    className="hover:text-white transition-colors flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    hello@whoprompt.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/whoprompt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    @whoprompt
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center text-gray-400">
            <p>© 2025 WhoPrompt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
