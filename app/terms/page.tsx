import React from "react";
import LogoPrimary from "../../components/LogoPrimary";

export const metadata = {
  title: "Terms of Service | Trading-Analytics-Suite",
  description: "Trading-Analytics-Suite terms of use and regulatory disclaimers.",
};

export default function TermsOfService() {
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

      {/* 2. Main content container (constrained to max-w-3xl for extreme readability) [DESIGN (5).md] */}
      <article className="max-w-3xl mx-auto space-y-8 pb-24 leading-relaxed text-sm text-ash">
        
        {/* Title Block */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-ember-gold uppercase tracking-[0.2em]">
            Nocturnal Private Ledger
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-white italic tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-ash">
            Trading-Analytics-Suite (TAS) • Last Updated: June 28, 2026
          </p>
        </div>

        <p className="text-slate-300">
          By accessing or using Trading Analytics Suite (&quot;TAS&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) at any of our web properties, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms in full, you must immediately stop using TAS [1.2.6].
        </p>

        <p className="text-slate-300">
          These Terms constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;) and Trading Analytics Suite [1.2.6].
        </p>

        <hr className="border-iron/40" />

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">1. Who We Are</h2>
          <p>
            Trading Analytics Suite is a web-based analytical and educational trading journal platform designed for retail foreign exchange (Forex) and gold day-traders. TAS is operated out of Pakistan.
          </p>
          <div className="bg-graphite/40 border border-iron p-4 rounded-sm space-y-2">
            <p className="text-[10px] text-ember-gold uppercase font-bold tracking-wider">Crucial Regulatory Status</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li>An informational, analytical, and educational tool only</li>
              <li>NOT a brokerage, dealer, or financial institution</li>
              <li>NOT a registered investment advisor or financial advisory service</li>
              <li>NOT connected to any live trading account or broker</li>
            </ul>
          </div>
          <p>
            TAS does not hold user capital, does not execute real-world trades on your behalf, and does not provide personalized financial advice of any kind.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">2. Eligibility</h2>
          <p>You must meet all of the following conditions to use TAS:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>You are at least <strong className="text-white">18 years of age</strong></li>
            <li>You have the legal capacity to enter into a binding agreement</li>
            <li>You are not prohibited from using such services under the laws of your country of residence</li>
            <li>You agree to provide accurate and truthful information during registration</li>
          </ul>
          <p>
            By using TAS, you represent and confirm that you meet all of the above conditions. If you are under 18, you are strictly prohibited from using TAS and must immediately cease access.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">3. Freemium Model & Paid Plans</h2>
          <p>
            TAS operates on a freemium model. Certain features are available free of charge, while advanced features require a paid subscription.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Free tier features are subject to change or limitation at our discretion with reasonable notice</li>
            <li>Paid plan details, pricing, and billing cycles are described on our pricing page</li>
            <li>All fees are non-refundable unless stated otherwise in our Refund Policy</li>
            <li>We reserve the right to modify pricing with at least 14 days advance notice to existing subscribers</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">4. User Accounts</h2>

          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">4.1 Account Registration</h3>
            <p>
              Accounts are created and managed through Clerk, our third-party authentication provider [2]. You are responsible for maintaining the confidentiality of your account credentials [2].
            </p>
          </div>

          <div className="space-y-2 border-t border-iron/20 pt-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">4.2 Account Responsibility</h3>
            <p>
              You are solely responsible for all activity that occurs under your account. You must notify us immediately at <a href={`mailto:${contactEmail}`} className="text-ember-gold hover:underline font-mono">{contactEmail}</a> if you suspect unauthorized access to your account.
            </p>
          </div>

          <div className="space-y-2 border-t border-iron/20 pt-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">4.3 Account Termination</h3>
            <p>We reserve the right to suspend or permanently terminate your account if you:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Violate any part of these Terms</li>
              <li>Provide false information during registration</li>
              <li>Attempt to interfere with or disrupt the platform or other users</li>
              <li>Are found to be under 18 years of age</li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">5. Acceptable Use</h2>
          <p>
            You agree to use TAS only for its intended purpose — personal trade journaling, educational simulation, and analytical research [1, 3]. You must NOT:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Use TAS to provide financial advice to third parties</li>
            <li>Attempt to reverse-engineer, decompile, or extract source code from TAS</li>
            <li>Use automated bots, scrapers, or scripts to access TAS</li>
            <li>Share your account credentials with other individuals</li>
            <li>Upload malicious files, scripts, or content</li>
            <li>Attempt unauthorized access to the admin panel or any restricted area [3]</li>
            <li>Misuse the feedback system to submit spam or abusive content [3]</li>
            <li>Use TAS for any unlawful purpose under Pakistani law or the laws of your country</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">6. User-Generated Content</h2>
          <p>
            When you upload trade data, screenshots, notes, strategy rules, or any other content to TAS:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>You retain full ownership of that content</li>
            <li>You grant TAS a limited, non-exclusive license to store and display that content solely to provide you the service</li>
            <li>You confirm the content does not violate any third-party rights</li>
            <li>You are solely responsible for the accuracy of your logged trade data</li>
          </ul>
          <p>
            We do not claim ownership of your personal trade data. You may export or delete your data at any time.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">7. Third-Party Services</h2>
          <p>
            TAS integrates with several third-party services to function. Your use of TAS means you also interact with:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li><strong className="text-bone">Clerk</strong> — authentication and account management [2]</li>
            <li><strong className="text-bone">Supabase</strong> — database and file storage [3]</li>
            <li><strong className="text-bone">PostHog</strong> — usage analytics and session recording [1.2.8]</li>
            <li><strong className="text-bone">Sentry</strong> — error monitoring [2]</li>
            <li><strong className="text-bone">Resend</strong> — transactional email delivery [4]</li>
            <li><strong className="text-bone">Finnhub</strong> — live market data [1.3.8]</li>
            <li><strong className="text-bone">TradingView</strong> — charting widgets</li>
          </ul>
          <p>
            We are not responsible for the availability, accuracy, or conduct of these third-party services. Their own terms and privacy policies apply to your interactions with them.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">8. Market Data Disclaimer</h2>
          <p>
            Live price data displayed in TAS is sourced from Finnhub and TradingView [1.3.8]. This data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>May be delayed or inaccurate</li>
            <li>Is provided for informational and educational purposes only</li>
            <li>Must NOT be relied upon for actual trade execution decisions</li>
            <li>Is subject to the data providers&apos; own terms and availability [1.2.6]</li>
          </ul>
          <p>
            TAS makes no representations regarding the accuracy, completeness, or timeliness of any market data displayed on the platform.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">9. Intellectual Property</h2>
          <p>
            All content, design, code, branding, and materials comprising TAS — excluding your personal user data — are the exclusive intellectual property of Trading Analytics Suite and are protected under applicable law.
          </p>
          <p>
            You may not reproduce, copy, distribute, or create derivative works from any part of TAS without our express written permission.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">10. Limitation of Liability</h2>
          <p className="text-[11px] font-bold text-ash uppercase tracking-wider">To the maximum extent permitted by applicable law:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>TAS is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind [1.2.6]</li>
            <li>We do not guarantee uninterrupted, error-free, or secure access to TAS</li>
            <li>We are not liable for any financial losses, trading losses, lost profits, or damages of any kind arising from your use of TAS</li>
            <li>Our total cumulative liability to you under any circumstance shall not exceed the amount you paid to TAS in the 3 months preceding the claim</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless TAS and its operators from any claims, damages, losses, or expenses (including legal fees) arising from your use or misuse of TAS, your violation of these Terms, or any trading decisions made based on tools or data from TAS.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">12. Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. When we do, we will update the &quot;Last Updated&quot; date at the top of this document [1.2.6]. For material changes, we will notify you via email or an in-app notice.
          </p>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">13. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the <strong className="text-white">Islamic Republic of Pakistan</strong>. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of <strong className="text-white">Islamabad, Pakistan</strong>.
          </p>
        </section>

        {/* Section 15 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">14. Contact Us</h2>
          <p>
            For any questions about these Terms, please contact us at:
          </p>
          <p className="font-mono text-sm bg-graphite border border-iron p-4 rounded-sm inline-block text-ember-gold">
            Email: {contactEmail}
          </p>
        </section>

      </article>
    </main>
  );
}