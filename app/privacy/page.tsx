// app/privacy/page.tsx
"use client";

import PublicNav from "@/components/PublicNav";
import { Shield, Lock, Database, Eye, FileText, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicNav />

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Privacy Policy
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
            Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* TL;DR */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-6 mb-12">
          <div className="flex items-start">
            <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                TL;DR
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We take your privacy seriously. We encrypt your database
                credentials, never store your business data permanently, and
                only collect the minimum information needed to provide our
                service.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              1. Information We Collect
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1.1 Account Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  When you create an account, we collect:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Email address</li>
                  <li>Name (optional)</li>
                  <li>Password (hashed and salted)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1.2 Database Connection Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  To provide our service, we collect and encrypt:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>
                    Database connection credentials (encrypted with AES-256-GCM)
                  </li>
                  <li>Database hostname and port</li>
                  <li>
                    Database schema information (table names, column names, data
                    types)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1.3 Usage Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                  <li>Queries you submit (for improving AI accuracy)</li>
                  <li>Query execution times and error logs</li>
                  <li>Feature usage analytics</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1.4 Payment Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We use Stripe for payment processing. We never see or store
                  your full credit card information.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              2. How We Use Your Information
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    To provide our service:
                  </strong>{" "}
                  Connect to your databases and execute queries
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    To improve our AI:
                  </strong>{" "}
                  Train our models to generate better SQL queries
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    To communicate:
                  </strong>{" "}
                  Send service updates, security alerts, and support responses
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    To prevent abuse:
                  </strong>{" "}
                  Monitor for suspicious activity and enforce usage limits
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              3. Data Storage and Security
            </h2>

            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-r-lg p-6">
                <div className="flex items-start">
                  <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      3.1 Encryption
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Your database credentials are encrypted at rest using
                      AES-256-GCM encryption. Connection strings are never
                      stored in plain text.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3.2 Query Results
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Query results are temporarily stored in memory for
                  visualization purposes only. We do not permanently store your
                  business data.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3.3 Access Controls
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Only read-only SQL queries (SELECT, WITH) are allowed. Write
                  operations (INSERT, UPDATE, DELETE, DROP) are blocked.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              4. Data Sharing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We do not sell, rent, or share your personal information or
              database credentials with third parties, except:
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    Service Providers:
                  </strong>{" "}
                  AWS (hosting), Stripe (payments), Google (AI services) - all
                  under strict data processing agreements
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    Legal Requirements:
                  </strong>{" "}
                  When required by law or to protect our rights
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              5. Data Retention
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    Account data:
                  </strong>{" "}
                  Retained until you delete your account
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    Query history:
                  </strong>{" "}
                  Retained according to your plan (7-365 days)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    Query results:
                  </strong>{" "}
                  Cleared after 24 hours or when you close your session
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              6. Your Rights
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have the right to:
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>Access your personal data</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>Correct inaccurate data</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>Delete your account and all associated data</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>Export your query history</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 font-bold">•</span>
                <span>Opt-out of marketing communications</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              7-10. Additional Policies
            </h2>
            <div className="space-y-6 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  7. Cookies and Tracking
                </h3>
                <p>
                  We use essential cookies for authentication and session
                  management. We do not use third-party advertising cookies.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  8. Children&apos;s Privacy
                </h3>
                <p>
                  Our service is not intended for users under 18 years of age.
                  We do not knowingly collect information from children.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  9. International Data Transfers
                </h3>
                <p>
                  Your data is primarily stored in US-based data centers. By
                  using our service, you consent to this transfer and
                  processing.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  10. Changes to This Policy
                </h3>
                <p>
                  We may update this policy from time to time. We&apos;ll notify
                  you of significant changes via email or through the platform.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Contact Us
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  For privacy concerns or to exercise your rights, contact us
                  at:
                </p>
                <a
                  href="mailto:privacy@whoprompt.com"
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  privacy@whoprompt.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
