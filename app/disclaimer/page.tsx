import React from "react";
import LogoPrimary from "../../components/LogoPrimary";

export const metadata = {
  title: "Risk Disclaimer | Trading-Analytics-Suite",
  description: "Trading-Analytics-Suite financial risk disclosures and liability disclaimers.",
};

export default function RiskDisclaimer() {
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
            Risk Disclaimer
          </h1>
          <p className="text-xs text-ash">
            Trading-Analytics-Suite (TAS) • Last Updated: June 28, 2026
          </p>
        </div>

        {/* Highlighted Top Warning Box [DESIGN (5).md] */}
        <div className="bg-graphite border border-ember-gold/30 p-6 rounded-sm space-y-3">
          <p className="text-xs font-bold text-ember-gold uppercase tracking-widest">
            IMPORTANT — READ BEFORE USING THIS PLATFORM
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            This Risk Disclaimer is a legally binding part of your agreement with Trading Analytics Suite [1]. By accessing or using any feature of TAS, you confirm that you have read, understood, and accepted every statement in this document in full [1].
          </p>
        </div>

        <hr className="border-iron/40" />

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">1. TAS Is Not a Financial Advisor</h2>
          <p>
            Trading Analytics Suite is strictly an <strong className="text-white">informational, analytical, and educational platform</strong> [3]. Nothing on TAS — including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li>The Risk & Position Size Calculator</li>
            <li>The Trade Journal Ledger [3]</li>
            <li>The Strategy Playbook and interactive checklists [3]</li>
            <li>The Backtest Sandbox and its historical results [1]</li>
            <li>The live price ticker and TradingView charts</li>
            <li>Price alert notifications [3]</li>
            <li>Any default or user-created strategy template [3]</li>
          </ul>
          <p>
            ...constitutes financial advice, investment advice, trading recommendations, or any form of professional financial guidance.
          </p>
          <p>
            TAS does not know your financial situation, your risk tolerance, your investment goals, or your trading experience. No output produced by any TAS tool should be interpreted as a recommendation to buy, sell, or hold any financial instrument.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">2. Foreign Exchange & Gold Trading Carries Substantial Risk</h2>
          <p>
            Trading foreign exchange (Forex), gold (XAU/USD), and related derivative instruments involves a <strong className="text-white">high level of risk and may not be suitable for all investors.</strong> You should be aware of and carefully consider the following before trading:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li><strong className="text-bone">You may lose all of your invested capital.</strong> Forex and gold markets are highly volatile. Prices can move rapidly and unpredictably.</li>
            <li><strong className="text-bone">Leverage amplifies both profits and losses.</strong> Trading on margin means a small adverse price movement can result in losses that exceed your initial deposit.</li>
            <li><strong className="text-bone">Past performance is not indicative of future results.</strong> Historical win rates, P&L figures, and strategy statistics — whether your own or displayed anywhere on TAS — do not guarantee future trading performance [3].</li>
            <li><strong className="text-bone">No strategy guarantees profitability.</strong> Even a strategy with a historically high win rate can and will experience losing periods [3].</li>
          </ul>
          <p className="italic text-ash">
            Only trade with capital you can afford to lose entirely without affecting your financial wellbeing.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">3. The Position Size Calculator — Important Limitations</h2>
          <p>
            The Risk & Position Size Calculator on TAS is a mathematical computation tool. It performs arithmetic based on values you input [DESIGN (5).md]. You are solely responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>The accuracy of the account balance, risk percentage, and stop-loss values you enter</li>
            <li>Verifying that calculated position sizes comply with your broker&apos;s margin and lot size requirements [1.2.6]</li>
            <li>Confirming that output values are appropriate for your specific broker, account type, and instrument</li>
          </ul>
          <p>
            TAS makes no guarantee that calculator outputs are accurate for your specific brokerage platform. Broker conditions, account currencies, instrument specifications, and commission structures vary widely. Always verify position sizes independently with your broker before placing any trade.
          </p>
          <p className="font-bold text-bone">
            TAS is not liable for any financial losses arising from the use of the position size calculator [1].
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">4. Hypothetical & Simulated Performance — Backtest Sandbox</h2>
          <p>
            The Backtest Sandbox within TAS is a <strong className="text-white">quarantined simulation environment</strong> designed for historical strategy research only [1].
          </p>
          <p className="bg-graphite/40 border border-iron p-4 text-xs leading-relaxed text-slate-300">
            <strong className="text-white">All results generated in the Backtest Sandbox are hypothetical and simulated. They do not represent actual trading results [1].</strong>
          </p>
          <p>
            Simulated performance results have inherent limitations and are subject to the following [1]:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li>Hypothetical results are prepared with the benefit of hindsight [1]</li>
            <li>Simulated trades are not subject to the same execution risks as live trades, including slippage, requotes, broker spread widening, and liquidity gaps [1]</li>
            <li>Simulated results do not account for the psychological pressures of live trading, which can significantly affect real-world performance [1]</li>
            <li>The ability to simulate a strategy does not mean the same results would have been achieved in live markets [1]</li>
          </ul>
          <p>
            <strong className="text-bone">Backtest statistics displayed in TAS — including Simulated P&L, Simulated Win Rate, and Total Simulated Trades — must never be interpreted as a prediction, projection, or guarantee of future live trading performance [1].</strong>
          </p>
          <p>
            Backtest data in the Sandbox is completely isolated from your live Trade Journal statistics to prevent misinterpretation [1].
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">5. Live Market Data — Accuracy Not Guaranteed</h2>
          <p>
            Live price data displayed on TAS is sourced from Finnhub and TradingView [1.3.8]. This data is provided for informational and educational purposes only [3].
          </p>
          <p>
            TAS does not guarantee the accuracy, completeness, timeliness, or uninterrupted availability of any market data displayed on the platform. Price data may be delayed due to network conditions or provider outages, slightly different from the prices available on your broker&apos;s platform [1.2.6], or unavailable during periods of market data provider downtime.
          </p>
          <p>
            <strong className="text-bone">Do not use TAS price data as the basis for executing actual trades on any brokerage platform.</strong> Always refer to your broker&apos;s own platform for official trade execution prices [1.2.6].
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">6. Price Alerts — Not a Guarantee of Execution</h2>
          <p>
            The Price Alert feature in TAS sends browser notifications and email alerts when a configured price level is reached [3]. These alerts are informational notifications only, may be delayed depending on network conditions, and are not guaranteed to be delivered in real-time under all conditions [3.1, 4].
          </p>
          <p>
            TAS is not liable for any missed opportunities, losses, or trading decisions made based on a delayed, missed, or incorrectly triggered price alert.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">7. No Broker Connection</h2>
          <p>
            TAS does not connect to, communicate with, or interact with any live brokerage account. TAS cannot place, modify, or cancel orders, nor access your broker account balance in real-time.
          </p>
          <p>
            All trade data within TAS is manually entered or imported by you. TAS is a logging and analytical tool only.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">8. Limitation of Liability for Trading Losses</h2>
          <p className="text-[11px] font-bold text-ash uppercase tracking-wider">To the maximum extent permitted by applicable law, Trading Analytics Suite, its operators, developers, and affiliates shall not be liable for:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
            <li>Any direct or indirect financial losses incurred as a result of trading decisions made while using TAS [1]</li>
            <li>Any losses arising from reliance on the position size calculator, price alerts, strategy playbooks, or any other tool within TAS [3]</li>
            <li>Any losses resulting from inaccurate market data displayed on the platform</li>
            <li>Any consequential, incidental, or punitive damages of any kind related to your trading activity</li>
          </ul>
          <p className="font-mono text-sm bg-graphite border border-iron p-4 rounded-sm inline-block text-ember-gold">
            YOUR USE OF TAS IS ENTIRELY AT YOUR OWN RISK.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">9. Seek Professional Advice</h2>
          <p>Before engaging in Forex or gold trading, we strongly recommend that you:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Consult a licensed and regulated financial advisor in your country</li>
            <li>Fully understand the products you intend to trade and the risks involved</li>
            <li>Verify whether Forex trading is legally permitted in your country of residence</li>
            <li>Only trade with a regulated and reputable broker</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">10. Regulatory Notice</h2>
          <p>
            TAS is not registered with, licensed by, or regulated by any financial regulatory authority in Pakistan, the United States, the European Union, or any other jurisdiction. TAS does not require such registration because it is not a financial service provider — it is an educational and analytical software platform.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg md:text-xl font-bold text-bone mt-6">11. Contact Us</h2>
          <p>
            For any questions about this disclaimer, contact us at:
          </p>
          <p className="font-mono text-sm bg-graphite border border-iron p-4 rounded-sm inline-block text-ember-gold">
            Email: {contactEmail}
          </p>
        </section>

      </article>
    </main>
  );
}