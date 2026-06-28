import React from "react";
import LogoPrimary from "../../components/LogoPrimary";

export const metadata = {
  title: "Privacy Policy | Trading-Analytics-Suite",
  description: "Trading-Analytics-Suite private data protection and processing disclosure.",
};

export default function PrivacyPolicy() {
  const contactEmail = "support@trading-analytics-suite.com";

  return (
    <main className="min-h-screen bg-obsidian text-bone font-sans p-6 md:p-12 relative selection:bg-ember-gold selection:text-obsidian">
      
      {/* 1. Header with back CTA and Brand Logo [DESIGN (5).md] */}
      <header className="max-w-3xl mx-auto flex items-center justify-between mb-12 border-b border-iron pb-6">
        <a 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold text-ash hover:text-white transition-colors duration-200 uppercase tracking-widest"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Terminal
        </a>
        <LogoPrimary />
      </header>

      {/* 2. Main content container (constrained to max-w-3xl for extreme readability) */}
      <article className="max-w-3xl mx-auto space-y-8 pb-24 leading-relaxed text-sm text-ash">
        
        {/* Title Block */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-ember-gold uppercase tracking-[0.2em]">
            Nocturnal Private Ledger
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-white italic tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-ash">
            Trading-Analytics-Suite (TAS) • Last Updated: June 28, 2026
          </p>
        </div>

        <p className="text-slate-300">
          Trading-Analytics-Suite ("TAS", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, who we share it with, and what rights you have over it.
        </p>

        <p className="text-slate-300">
          By using TAS, you agree to the collection and use of your information as described in this policy. If you do not agree, please stop using TAS immediately.
        </p>

        <p className="text-slate-300">
          This policy applies to all users globally. Where you are located in a region with specific data protection laws (such as the EU/EEA under GDPR), additional rights and protections apply to you as noted throughout this document.
        </p>

        <hr className="border-iron/40" />

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">1. Who Is Responsible for Your Data</h2>
          <p>
            Trading-Analytics-Suite is the data controller responsible for your personal information. We are operated from Rawalpindi, Pakistan.
          </p>
          <p>
            Contact for privacy matters: <a href={`mailto:${contactEmail}`} className="text-ember-gold hover:underline font-mono">{contactEmail}</a>
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">2. Minimum Age</h2>
          <p>
            TAS is strictly for users aged <strong className="text-white">18 and above</strong>. We do not knowingly collect personal data from anyone under 18. If we discover that a user under 18 has created an account, we will immediately terminate that account and delete associated data. If you believe a minor has registered, please contact us at <a href={`mailto:${contactEmail}`} className="text-ember-gold hover:underline font-mono">{contactEmail}</a>.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">3. What Data We Collect</h2>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.1 Account & Identity Data</h3>
            <p>Collected via our authentication provider Clerk:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Full name</li>
              <li>Email address</li>
              <li>Password (stored and managed securely by Clerk — we do not have access to your raw password)</li>
              <li>Account creation date</li>
              <li>Session tokens and login activity</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.2 Trade Journal Data</h3>
            <p>Data you voluntarily enter into TAS:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Trade records (date, currency pair, direction, entry/exit prices, P&L, risk %, R:R, session, emotion, confluence score, notes)</li>
              <li>Custom fields and formulas you create via the CSV importer [3]</li>
              <li>Strategy names, rules, and checklist entries [3]</li>
              <li>Backtest simulation records [1]</li>
              <li>Price alert targets and trigger history [3]</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.3 Uploaded Files</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Trade screenshots or files you upload to the platform [3]</li>
              <li>These are stored in a secure cloud storage bucket (Supabase S3-compatible storage) [3]</li>
              <li>We store the URL link to the file, not the raw binary, in your database row [3]</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.4 Usage & Behavioral Data (PostHog)</h3>
            <p>We use PostHog to understand how users interact with TAS [1.2.8]. PostHog automatically collects:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Pages visited and navigation paths [1.2.8]</li>
              <li>Buttons clicked and features used [1.2.8]</li>
              <li>Time spent on each section [1.2.8]</li>
              <li>
                <strong className="text-white">Session Replays: PostHog records video-like recordings of your screen interactions within TAS [1.1.1].</strong> This includes mouse movements, clicks, and scrolling behavior. These recordings are used solely by our team to improve the user experience and identify usability issues.
              </li>
            </ul>
            <p>You can opt out of PostHog session recording by contacting us at <a href={`mailto:${contactEmail}`} className="text-ember-gold hover:underline font-mono">{contactEmail}</a>.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.5 Error & Crash Data (Sentry)</h3>
            <p>If TAS encounters a JavaScript error or crash on your device, Sentry automatically captures [2]:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>The error message and the specific line of code that failed [2]</li>
              <li>Your browser type and version [2]</li>
              <li>Your operating system [2]</li>
              <li>Relevant system variables at the time of the error [2]</li>
            </ul>
            <p>Sentry does NOT capture your trade data or personal financial information during error reports.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.6 Feedback Data</h3>
            <p>If you submit a bug report or feature request via the in-app feedback widget [3]:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Your message content</li>
              <li>Your registered email address (captured automatically)</li>
              <li>Submission timestamp</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">3.7 Technical & Device Data</h3>
            <p>Automatically collected when you use TAS:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device type (desktop/mobile/tablet)</li>
              <li>Referring URL</li>
              <li>Session cookies (managed by Clerk)</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Table styled in strict Ledger layout [DESIGN (5).md] */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">4. Why We Collect Your Data (Legal Basis)</h2>
          
          <div className="border border-iron rounded-sm overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-inkwell/50 border-b border-iron text-ash">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Data Type</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron bg-graphite/10">
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Account data</td>
                  <td className="px-4 py-3">To create and manage your account</td>
                  <td className="px-4 py-3">Contract performance</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Trade journal data</td>
                  <td className="px-4 py-3">To provide core journaling functionality</td>
                  <td className="px-4 py-3">Contract performance</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Uploaded files</td>
                  <td className="px-4 py-3">To display your screenshots in trade records</td>
                  <td className="px-4 py-3">Contract performance</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Usage data (PostHog)</td>
                  <td className="px-4 py-3">To improve UI/UX and platform features</td>
                  <td className="px-4 py-3">Legitimate interests</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Session replays (PostHog)</td>
                  <td className="px-4 py-3">To identify usability issues and bugs</td>
                  <td className="px-4 py-3">Legitimate interests</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Error data (Sentry)</td>
                  <td className="px-4 py-3">To detect and fix technical issues</td>
                  <td className="px-4 py-3">Legitimate interests</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Feedback data</td>
                  <td className="px-4 py-3">To receive and action user bug reports</td>
                  <td className="px-4 py-3">Legitimate interests</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Email address (Resend)</td>
                  <td className="px-4 py-3">To send price alert notification emails</td>
                  <td className="px-4 py-3">Contract performance / Consent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">5. Third-Party Data Processors</h2>
          <p>
            To operate TAS, we share your data with the following trusted third-party processors. Each is bound by their own privacy policies and data processing agreements:
          </p>

          <div className="space-y-3">
            <p><strong className="text-bone">Clerk Inc. (Authentication)</strong></p>
            <p className="text-xs">Your email, name, password (hashed), and session data to manage logins. <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-ember-gold hover:underline">Privacy Policy</a></p>
          </div>

          <div className="space-y-3 border-t border-iron/20 pt-3">
            <p><strong className="text-bone">Supabase Inc. (Database & Storage)</strong></p>
            <p className="text-xs">Your trade records, strategy data, alert data, feedback, and uploaded file objects for secure storage. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-ember-gold hover:underline">Privacy Policy</a></p>
          </div>

          <div className="space-y-3 border-t border-iron/20 pt-3">
            <p><strong className="text-bone">PostHog Inc. (Analytics & Session Recording)</strong></p>
            <p className="text-xs">Your usage behavior, navigation data, clicks, and screen session recordings to improve usability. <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-ember-gold hover:underline">Privacy Policy</a></p>
          </div>

          <div className="space-y-3 border-t border-iron/20 pt-3">
            <p><strong className="text-bone">Sentry / Functional Software Inc. (Error Monitoring)</strong></p>
            <p className="text-xs">Browser type, OS, error details, and system variables at crash time to detect bugs. <a href="https://sentry.io/privacy" target="_blank" rel="noopener noreferrer" className="text-ember-gold hover:underline">Privacy Policy</a></p>
          </div>

          <div className="space-y-3 border-t border-iron/20 pt-3">
            <p><strong className="text-bone">Resend Inc. (Email Delivery)</strong></p>
            <p className="text-xs">Your email address and the content of price alert notifications to deliver them to your inbox. <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-ember-gold hover:underline">Privacy Policy</a></p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">6. Cookies</h2>
          <p>
            TAS uses cookies to manage user session states and collect performance data. Disabling session cookies will prevent you from logging in. For full details, please refer to our Cookie Policy.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">7. Data Retention</h2>
          <p>
            We retain your personal data until you delete your account, or choose to delete specific entries (like trades or alerts). Once an account is deleted, all personal data is deleted or anonymized within 30 days, except where we are legally required to retain it.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">8. Data Security</h2>
          <p>
            We implement the following secure technical measures to protect your private ledger:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong className="text-bone">Row-Level Security (RLS):</strong> Every database table has PostgreSQL Row-Level Security enabled, ensuring your logged data is strictly isolated—no other user can ever read, access, or modify your records.</li>
            <li><strong className="text-bone">Encrypted Connections:</strong> All data is transmitted over HTTPS/TLS encrypted connections.</li>
            <li><strong className="text-bone">No Raw Password Storage:</strong> Credentials are managed entirely by Clerk and are never written to our database.</li>
            <li><strong className="text-bone">Restricted Admin Access:</strong> Our admin panel is password-encrypted with 0 public links.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">9. Your Rights</h2>
          <p>
            You have the right to access, correct, or request the deletion of your personal data. If you are located in the EU/EEA (GDPR), you also have the right to data portability, processing restriction, and to lodge a complaint with your local Data Protection Authority. 
          </p>
          <p>
            To exercise any of these rights, contact us at <a href={`mailto:${contactEmail}`} className="text-ember-gold hover:underline font-mono">{contactEmail}</a>.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">10. Data We Do NOT Collect or Do</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>We do NOT sell your personal data to any third party.</li>
            <li>We do NOT connect to your live broker account or hold any capital.</li>
            <li>We do NOT store your payment card details.</li>
            <li>We do NOT send marketing emails without your explicit consent.</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">11. International Data Transfers</h2>
          <p>
            TAS is operated from Pakistan. Our third-party processors are primarily based in the United States. By using TAS, you acknowledge that your data may be transferred to and processed in countries outside your own. All transfers are conducted under appropriate safeguards.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or an in-app notice and update the date at the top of this document.
          </p>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">13. Contact Us</h2>
          <p>
            For any privacy-related questions, data requests, or concerns, please contact us at:
          </p>
          <p className="font-mono text-sm bg-graphite border border-iron p-4 rounded-sm inline-block text-ember-gold">
            Email: {contactEmail}
          </p>
        </section>

      </article>
    </main>
  );
}