// app/contact/page.tsx
"use client";

import { useState } from "react";
import PublicNav from "@/components/PublicNav";
import { Mail, Send, Twitter, CheckCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);
    setFormData({ name: "", email: "", subject: "", message: "" });

    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicNav />

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 bg-teal-600 rounded-2xl flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Get in Touch
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            We&apos;d love to hear from you. Send us a message and we&apos;ll
            respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Send us a message
              </h2>

              {submitted && (
                <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-3" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      Thank you! Your message has been sent successfully.
                      We&apos;ll get back to you soon.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="enterprise">Enterprise Sales</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Other ways to reach us
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Email
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      For general inquiries and support
                    </p>
                    <a
                      href="mailto:hello@whoprompt.com"
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      hello@whoprompt.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Twitter className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Twitter/X
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Follow us for updates and tips
                    </p>
                    <a
                      href="https://twitter.com/whoprompt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      @whoprompt
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Enterprise Solutions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Need unlimited queries, custom integrations, or dedicated
                support? Let&apos;s talk about our Enterprise plan.
              </p>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Unlimited queries & connections</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Priority support with SLA</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Custom integrations & features</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
              </div>
              <a
                href="mailto:hello@whoprompt.com?subject=Enterprise Inquiry"
                className="block w-full text-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Contact Sales
              </a>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Support Hours
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Email Support:
                  </span>
                  <span>24/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Response Time:
                  </span>
                  <span>Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Priority Support:
                  </span>
                  <span>Growth+ plans</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Before reaching out, check our{" "}
                  <Link
                    href="/docs"
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    documentation
                  </Link>{" "}
                  for quick answers to common questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
