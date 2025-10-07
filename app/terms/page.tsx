/* eslint-disable react/no-unescaped-entities */
// app/terms/page.tsx
"use client";

import PublicNav from "@/components/PublicNav";
import {
  FileText,
  Scale,
  AlertTriangle,
  CheckCircle,
  Mail,
} from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicNav />

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Terms of Service
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
            <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                TL;DR
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Use our service responsibly. Don't abuse it, don't try to hack
                it, and don't use it for anything illegal. We provide the
                service "as is" and reserve the right to modify or terminate
                accounts that violate these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Section 1-3 - Acceptance & Account */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              1-3. Acceptance, Service Description & Account Registration
            </h2>
            <div className="space-y-6 text-gray-600 dark:text-gray-400">
              <p>
                By accessing or using WhoPrompt ("the Service"), you agree to be
                bound by these Terms of Service. The Service is an AI-powered
                database analytics platform that allows users to query their
                databases using natural language.
              </p>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Account Requirements:
                </h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>You must be at least 18 years old</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Provide accurate registration information</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Maintain security of your account credentials</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Notify us immediately of unauthorized access</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 - Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              4. Acceptable Use Policy
            </h2>
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg p-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Prohibited Activities
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      You agree NOT to:
                    </p>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        <span>
                          Access databases you don't own or have permission to
                          access
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        <span>
                          Attempt to reverse engineer or extract source code
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        <span>Use the Service for illegal purposes</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        <span>Bypass rate limits or usage restrictions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        <span>Share account credentials with others</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 - Database Connections */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              5. Database Connections & Security
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p className="font-semibold text-gray-900 dark:text-white">
                You are solely responsible for:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 font-bold">•</span>
                  <span>The accuracy of database connection information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 font-bold">•</span>
                  <span>Ensuring you have proper authorization to connect</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 font-bold">•</span>
                  <span>Creating read-only database users</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 font-bold">•</span>
                  <span>The security of your database systems</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 - Subscription & Payment */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              6. Subscription and Payment
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Billing Terms
                </h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>
                      Paid plans billed monthly or annually in advance
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>
                      All fees are non-refundable except as required by law
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>
                      Usage limits apply per plan (Free: 3/day, Starter: 50/day,
                      Growth: 300/day)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>
                      You may cancel anytime; service continues until period end
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7 - Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              7. Intellectual Property
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">
                  Our IP:
                </strong>{" "}
                The Service, including software, algorithms, and UI/UX, is owned
                by WhoPrompt.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  Your Data:
                </strong>{" "}
                You retain all rights to your database data and queries. We
                claim no ownership.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">
                  License Grant:
                </strong>{" "}
                You grant us limited license to access databases on your behalf
                and use anonymized query patterns to improve AI.
              </p>
            </div>
          </section>

          {/* Section 8-9 - Service Availability & Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              8-9. Service Availability & Disclaimers
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg p-6">
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    No Warranty:
                  </strong>{" "}
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY
                  KIND.
                </p>
                <p>We don't guarantee:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠</span>
                    <span>The accuracy of AI-generated SQL queries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠</span>
                    <span>Completeness or correctness of query results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠</span>
                    <span>Uninterrupted or error-free service</span>
                  </li>
                </ul>
                <p className="pt-4">
                  <strong className="text-gray-900 dark:text-white">
                    Limitation of Liability:
                  </strong>{" "}
                  We shall not be liable for indirect, incidental, or
                  consequential damages, or damages exceeding what you paid us
                  in the past 12 months.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10-11 - Indemnification & Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              10-11. Indemnification & Termination
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                You agree to indemnify us from claims arising from your use of
                the Service or violation of these Terms.
              </p>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Termination
                </h3>
                <p className="mb-2">
                  We may suspend or terminate your account if:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>You violate these Terms</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>Your account is used for fraudulent activity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-600 mr-2 font-bold">•</span>
                    <span>You fail to pay applicable fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 12-18 - Legal Boilerplate */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              12-18. Additional Terms
            </h2>
            <div className="space-y-6 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  12. Privacy
                </h3>
                <p>
                  Your use is governed by our{" "}
                  <a
                    href="/privacy"
                    className="text-emerald-600 hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  13. Changes to Terms
                </h3>
                <p>
                  We may update these Terms at any time. Material changes will
                  be notified via email.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  14. Governing Law
                </h3>
                <p>
                  These Terms are governed by the laws of the United States and
                  the State of Delaware.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  15. Dispute Resolution
                </h3>
                <p>
                  Disputes shall be resolved through binding arbitration in
                  accordance with AAA rules.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  16. Severability
                </h3>
                <p>
                  If any provision is unenforceable, remaining provisions stay
                  in effect.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  17. Entire Agreement
                </h3>
                <p>
                  These Terms and our Privacy Policy constitute the entire
                  agreement.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  18. Contact
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  For questions about these Terms, contact us at:
                </p>
                <a
                  href="mailto:legal@whoprompt.com"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  legal@whoprompt.com
                </a>
                <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thank you for choosing WhoPrompt. We're committed to
                    providing a reliable, secure, and powerful database
                    analytics platform.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
