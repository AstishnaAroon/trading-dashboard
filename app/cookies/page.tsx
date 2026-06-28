import React from "react";
import LogoPrimary from "../../components/LogoPrimary";

export const metadata = {
  title: "Cookie Policy | Trading-Analytics-Suite",
  description: "Trading-Analytics-Suite cookies and dynamic tracking technology disclosures.",
};

export default function CookiePolicy() {
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

      {/* 2. Main content container [DESIGN (5).md] */}
      <article className="max-w-3xl mx-auto space-y-8 pb-24 leading-relaxed text-sm text-ash">
        
        {/* Title Block */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-ember-gold uppercase tracking-[0.2em]">
            Nocturnal Private Ledger
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-white italic tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-xs text-ash">
            Trading-Analytics-Suite (TAS) • Last Updated: June 28, 2026
          </p>
        </div>

        <p className="text-slate-300">
          Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work efficiently and to provide information to website operators.
        </p>

        <p className="text-slate-300">
          TAS uses cookies and similar tracking technologies (such as local storage and session tokens) to operate the platform, keep you logged in, and understand how you use our service [2, 3].
        </p>

        <hr className="border-iron/40" />

        {/* Section 1: Necessary Cookies [DESIGN (5).md] */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">1. Strictly Necessary Cookies</h2>
          <p>
            These cookies are essential for TAS to function. Without them, you cannot log in or use the platform [2]. These cannot be disabled.
          </p>

          <div className="border border-iron rounded-sm overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-inkwell/50 border-b border-iron text-ash">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Cookie</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron bg-graphite/10">
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Session token</td>
                  <td className="px-4 py-3">Clerk</td>
                  <td className="px-4 py-3">Keeps you authenticated and logged into your account [2]</td>
                  <td className="px-4 py-3 font-mono">Session / until logout</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Auth state</td>
                  <td className="px-4 py-3">Clerk</td>
                  <td className="px-4 py-3">Maintains your login state across page refreshes [2]</td>
                  <td className="px-4 py-3 font-mono">Persistent (until logout)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Analytics & Behavioral Cookies [DESIGN (5).md] */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">2. Analytics & Behavioral Cookies</h2>
          <p>
            These cookies help us understand how users interact with TAS so we can improve the platform [1.2.8]. They are set by PostHog.
          </p>

          <div className="border border-iron rounded-sm overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-inkwell/50 border-b border-iron text-ash">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Cookie</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron bg-graphite/10">
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Distinct ID</td>
                  <td className="px-4 py-3">PostHog</td>
                  <td className="px-4 py-3">Identifies your browser session for analytics [1.2.8]</td>
                  <td className="px-4 py-3 font-mono">1 year</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Session ID</td>
                  <td className="px-4 py-3">PostHog</td>
                  <td className="px-4 py-3">Groups your activity into a single session [1.2.8]</td>
                  <td className="px-4 py-3 font-mono">Session</td>
                </tr>
                <tr className="hover:bg-inkwell/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-bone">Feature flags</td>
                  <td className="px-4 py-3">PostHog</td>
                  <td className="px-4 py-3">Determines which features you have access to [1.2.8]</td>
                  <td className="px-4 py-3 font-mono">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-2 mt-4 bg-graphite/40 border border-iron p-4 rounded-sm text-xs">
            <p className="font-bold text-bone">What PostHog records [1.2.8]:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Pages you visit within TAS [1.2.8]</li>
              <li>Buttons and features you click [1.2.8]</li>
              <li>Navigation patterns [1.2.8]</li>
              <li><strong className="text-white">Session Replays:</strong> PostHog records video-like replays of your screen interactions inside TAS [1.1.1]. This is used exclusively by our team to identify usability problems and improve the interface.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">3. Error Monitoring Cookies</h2>
          <p>
            These are set by Sentry to associate JavaScript errors with your session so we can debug platform issues [2].
          </p>
          <div className="bg-graphite/40 border border-iron p-4 rounded-sm text-xs space-y-1">
            <p><strong className="text-bone">Sentry session cookie:</strong> Associates error reports with a browser session [2].</p>
            <p><strong className="text-ash">Duration:</strong> <span className="font-mono text-bone">Session</span></p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">4. What We Do NOT Use Cookies For</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>We do NOT use advertising or retargeting cookies.</li>
            <li>We do NOT sell your cookie data to third parties.</li>
            <li>We do NOT use cookies to track you across other websites outside of TAS.</li>
            <li>We do NOT use cookies to profile you for marketing purposes.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">5. Managing and Disabling Cookies</h2>
          <p>
            You can control or delete cookies through your browser settings [2, 3].
          </p>
          <p>
            Disabling strictly necessary cookies (Clerk session cookies) will prevent you from logging into TAS. Core platform functionality will not work without them [2].
          </p>
          <p>
            If you wish to opt out of PostHog session recordings while continuing to use TAS, contact us at <a href={`mailto:${contactEmail}`} className="text-ember-gold hover:underline font-mono">{contactEmail}</a> and we will configure your account to be excluded [1.1.1].
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">6. Cookie Consent</h2>
          <p>
            By continuing to use TAS after being presented with this Cookie Policy, you consent to our use of cookies as described above.
          </p>
          <p>
            For users in the EU/EEA, we obtain your explicit consent for non-essential cookies (analytics and error monitoring) before setting them, in accordance with GDPR and the ePrivacy Directive.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">7. Contact Us</h2>
          <p>
            For any questions about our use of cookies, contact us at:
          </p>
          <p className="font-mono text-sm bg-graphite border border-iron p-4 rounded-sm inline-block text-ember-gold">
            Email: {contactEmail}
          </p>
        </section>

      </article>
    </main>
  );
}