/* eslint-disable react/no-unescaped-entities */
// app/docs/page.tsx
"use client";

import {
  Database,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Key,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Database Connection Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about securely connecting your databases
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="sticky top-6 space-y-1">
              <a
                href="#overview"
                className="block px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Overview
              </a>
              <a
                href="#supported"
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Supported Databases
              </a>
              <a
                href="#security"
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Security Best Practices
              </a>
              <a
                href="#connection-strings"
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Connection Strings
              </a>
              <a
                href="#ssl"
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                SSL Configuration
              </a>
              <a
                href="#dos-donts"
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Do's and Don'ts
              </a>
              <a
                href="#troubleshooting"
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                Troubleshooting
              </a>
            </div>
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-3 prose prose-emerald dark:prose-invert max-w-none">
            {/* Overview */}
            <section id="overview" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                WhoPrompt securely connects to your database to run read-only
                queries. Your credentials are encrypted using AES-256-GCM
                encryption and stored securely. We never access your data
                directly - all queries run through secure, isolated connections.
              </p>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 my-6">
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Security First
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      All database credentials are encrypted at rest. We use
                      industry-standard encryption and never log or store your
                      query results permanently. Only read-only SELECT queries
                      are allowed.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Supported Databases */}
            <section id="supported" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Supported Databases
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                      <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      PostgreSQL
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Full support for PostgreSQL 9.6+. Recommended for production
                    use.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>✓ Native connection support</li>
                    <li>✓ SSL/TLS encryption</li>
                    <li>✓ Connection pooling</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                      <Database className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      MySQL
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Compatible with MySQL 5.7+ and MariaDB 10.2+.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>✓ Native connection support</li>
                    <li>✓ SSL/TLS encryption</li>
                    <li>✓ Connection pooling</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-3">
                      <Database className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      SQL Server
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Microsoft SQL Server 2016+ and Azure SQL Database.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>✓ Native connection support</li>
                    <li>✓ Encrypted connections</li>
                    <li>✓ Windows & SQL authentication</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                      <Database className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      SQLite
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    File-based database support for development and small
                    datasets.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>✓ Local file support</li>
                    <li>✓ Fast queries</li>
                    <li>✓ No server required</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Security Best Practices */}
            <section id="security" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Security Best Practices
              </h2>

              <div className="space-y-6">
                <div className="border-l-4 border-emerald-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    <Lock className="inline h-5 w-5 mr-2" />
                    Use Read-Only Database Users
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Create a dedicated database user with only SELECT
                    permissions. This ensures WhoPrompt can only read data,
                    never modify it.
                  </p>

                  {/* PostgreSQL Example */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      PostgreSQL:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                      <code className="text-sm text-gray-800 dark:text-gray-200">
                        CREATE USER dbstuff_readonly WITH PASSWORD
                        'secure_password';
                        <br />
                        GRANT CONNECT ON DATABASE mydb TO dbstuff_readonly;
                        <br />
                        GRANT USAGE ON SCHEMA public TO dbstuff_readonly;
                        <br />
                        GRANT SELECT ON ALL TABLES IN SCHEMA public TO
                        dbstuff_readonly;
                      </code>
                    </div>
                  </div>

                  {/* MySQL Example */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      MySQL:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                      <code className="text-sm text-gray-800 dark:text-gray-200">
                        CREATE USER 'dbstuff_readonly'@'%' IDENTIFIED BY
                        'secure_password';
                        <br />
                        GRANT SELECT ON mydb.* TO 'dbstuff_readonly'@'%';
                        <br />
                        FLUSH PRIVILEGES;
                      </code>
                    </div>
                  </div>

                  {/* SQL Server Example */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      SQL Server:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                      <code className="text-sm text-gray-800 dark:text-gray-200">
                        CREATE LOGIN dbstuff_readonly WITH PASSWORD =
                        'Secure_Password123!';
                        <br />
                        CREATE USER dbstuff_readonly FOR LOGIN dbstuff_readonly;
                        <br />
                        GRANT SELECT ON SCHEMA::dbo TO dbstuff_readonly;
                      </code>
                    </div>
                  </div>

                  {/* SQLite Note */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      SQLite:
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        SQLite uses file-system permissions. Ensure the file has
                        read-only access for the application user.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    <Key className="inline h-5 w-5 mr-2" />
                    Enable SSL/TLS Connections
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Always use SSL/TLS to encrypt data in transit. Most cloud
                    database providers (Neon, Supabase, AWS RDS) enable SSL by
                    default.
                  </p>
                </div>

                <div className="border-l-4 border-purple-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    <Shield className="inline h-5 w-5 mr-2" />
                    Whitelist IP Addresses (Optional)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    For additional security, configure your database firewall to
                    only accept connections from WhoPrompt's IP addresses.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    <AlertTriangle className="inline h-5 w-5 mr-2" />
                    Rotate Credentials Regularly
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Change your database passwords periodically and update them
                    in WhoPrompt. We recommend rotating every 90 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Connection Strings */}
            <section id="connection-strings" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Connection String Formats
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    PostgreSQL
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                    <code className="text-sm text-gray-800 dark:text-gray-200 block mb-2">
                      postgresql://username:password@hostname:5432/database_name?sslmode=require
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <strong>Examples:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    <li>
                      • Neon:{" "}
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                        postgresql://user:pass@ep-xxx.aws.neon.tech/dbname?sslmode=require
                      </code>
                    </li>
                    <li>
                      • Supabase:{" "}
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                        postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
                      </code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    MySQL
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                    <code className="text-sm text-gray-800 dark:text-gray-200 block">
                      mysql://username:password@hostname:3306/database_name
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Add{" "}
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                      ?ssl=true
                    </code>{" "}
                    for SSL connections.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    SQL Server
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                    <code className="text-sm text-gray-800 dark:text-gray-200 block">
                      Server=hostname,1433;Database=dbname;User
                      Id=username;Password=password;Encrypt=true;
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    SQLite
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
                    <code className="text-sm text-gray-800 dark:text-gray-200 block">
                      sqlite:///absolute/path/to/database.db
                    </code>
                  </div>
                </div>
              </div>
            </section>

            {/* SSL Configuration */}
            <section id="ssl" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                SSL/TLS Configuration
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                SSL/TLS encrypts data transmitted between WhoPrompt and your
                database, protecting credentials and query results from
                interception.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  When to Use SSL
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Production databases accessible over the internet
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Cloud-hosted databases (AWS RDS, Azure, GCP, etc.)
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Databases containing sensitive information
                    </span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500 dark:text-gray-400">
                      Local development databases (localhost)
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                SSL Modes (PostgreSQL)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recommended
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        disable
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        No SSL encryption
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        No
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        require
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        SSL required, no certificate verification
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                        Yes
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        verify-full
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        SSL with full certificate verification
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                        Best
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Do's and Don'ts */}
            <section id="dos-donts" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Do's and Don'ts
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-900/20">
                  <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Do's
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>
                        Create a dedicated read-only user for WhoPrompt
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Use SSL/TLS for all production connections</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Test connections before saving them</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>
                        Use strong, unique passwords for database users
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Monitor database logs for unusual activity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Keep your database software up to date</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>Document your connection configurations</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    Don'ts
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Never use admin or superuser accounts</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>
                        Don't grant INSERT, UPDATE, or DELETE permissions
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>
                        Avoid hardcoding credentials in application code
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>
                        Don't share database credentials across multiple
                        services
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Never disable SSL for production databases</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>Don't use default or weak passwords</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>
                        Avoid exposing databases directly to the internet
                        without firewall rules
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Troubleshooting Common Issues
              </h2>

              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Connection Timeout
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Symptoms:</strong> "Connection timeout" or "Could
                    not connect to database"
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>
                      Verify your database server is running and accessible
                    </li>
                    <li>Check firewall rules allow incoming connections</li>
                    <li>Confirm the hostname and port are correct</li>
                    <li>Ensure your database accepts remote connections</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Authentication Failed
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Symptoms:</strong> "Invalid username or password" or
                    "Access denied"
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Double-check username and password are correct</li>
                    <li>
                      Verify the user has proper permissions (at minimum SELECT)
                    </li>
                    <li>
                      Check if the user is allowed to connect from remote hosts
                    </li>
                    <li>
                      For PostgreSQL: Check pg_hba.conf for host-based
                      authentication rules
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    SSL/TLS Errors
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Symptoms:</strong> "SSL connection error" or
                    "Certificate verification failed"
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Enable SSL in your connection settings</li>
                    <li>Try using sslmode=require instead of verify-full</li>
                    <li>
                      Ensure your database server has SSL properly configured
                    </li>
                    <li>
                      Check that SSL certificates are valid and not expired
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Permission Denied on Queries
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Symptoms:</strong> "Permission denied for table" or
                    "Access denied"
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Grant SELECT permission on all required tables</li>
                    <li>For PostgreSQL: Grant USAGE on schemas</li>
                    <li>Verify the user can access the specified database</li>
                    <li>Check table-level and column-level permissions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Need Help */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Need Help?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Can't find what you're looking for? Our support team is here to
                help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Contact Support
                </Link>
                <a
                  href="mailto:hello@whoprompt.com"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
