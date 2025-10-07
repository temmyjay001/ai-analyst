// app/about/page.tsx
"use client";

import PublicNav from "@/components/PublicNav";
import {
  Target,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Heart,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            We believe that understanding your data shouldn&apos;t require a
            computer science degree. Every business decision should be informed
            by data, but too often, crucial insights are locked away behind
            complex SQL queries and technical barriers.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            WhoPrompt was built to democratize data access. We&apos;re
            empowering teams to ask questions in plain English and get instant,
            accurate answers from their databases - no SQL knowledge required.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Security First
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is your most valuable asset. We use enterprise-grade
                encryption and never store your business data.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                User-Centric Design
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We obsess over every interaction, ensuring our platform is
                intuitive for both technical and non-technical users.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Speed & Reliability
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fast insights drive better decisions. Our AI generates optimized
                queries that return results in seconds.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Continuous Innovation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We&apos;re constantly improving our AI models and adding
                features based on user feedback and the latest technology.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Why We Built This
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            The founding team spent years watching talented marketers, product
            managers, and executives wait days for simple data requests. We saw
            countless hours wasted on back-and-forth communication,
            miscommunicated requirements, and delayed decisions.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Meanwhile, data teams were overwhelmed with ad-hoc queries, taking
            time away from strategic analysis and meaningful insights.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We knew there had to be a better way. With advances in AI and
            natural language processing, we saw an opportunity to give everyone
            the power to query their own data safely and accurately.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Built for Modern Teams
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Whether you&apos;re a startup with 5 people or a growing company
            with 500, WhoPrompt scales with your needs:
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    1
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  For Product Teams
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track user behavior, feature adoption, and conversion metrics
                  without waiting for data team support.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    2
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  For Marketing Teams
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Analyze campaign performance, customer segments, and ROI in
                  real-time.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    3
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  For Executives
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get instant answers to business questions and make data-driven
                  decisions faster.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    4
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  For Data Teams
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Reduce ad-hoc query requests and empower stakeholders to
                  self-serve while maintaining data governance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-8 text-center">
          <Heart className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Join Us on This Journey
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            We&apos;re just getting started. Our roadmap includes advanced
            analytics, custom dashboards, collaborative features, and support
            for even more databases.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Start Free Today
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
