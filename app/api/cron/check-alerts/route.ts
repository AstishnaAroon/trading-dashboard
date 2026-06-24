import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";
import { Resend } from "resend";

export const dynamic = "force-dynamic"; // Prevents Next.js from caching the database/price queries

// This GET endpoint will be called automatically by Vercel Cron (or manually by us to test)
export async function GET(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!apiKey || !resendKey) {
      return NextResponse.json({ error: "Missing API keys on server" }, { status: 500 });
    }

    const resend = new Resend(resendKey);

    // 1. Fetch all active, untriggered alerts from Supabase [1]
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("id, email, pair, target_price, condition")
      .eq("is_triggered", false);

    if (alertsError) throw alertsError;

    // If there are no active alerts to process, exit early (saves resources) [1]
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: "No active alerts to check." }, { status: 200 });
    }

    // 2. Identify unique pairs (If 5 users are watching EUR/USD, we only fetch the price once)
    const uniquePairs = Array.from(new Set(alerts.map((a) => a.pair)));
    const prices: { [key: string]: number } = {};

    // 3. Fetch the latest market price for each unique pair from Finnhub [1.3.8]
    for (const pair of uniquePairs) {
      const apiSymbol = `OANDA:${pair.replace("/", "_")}`;
      const url = `https://finnhub.io/api/v1/quote?symbol=${apiSymbol}&token=${apiKey}`;
      
      const res = await fetch(url, { cache: "no-store" }); // Ensure fresh market data
      const data = await res.json();
      
      if (data && data.c) {
        prices[pair] = data.c; // Current quote price
      }
    }

    const triggeredAlerts = [];

    // 4. Process each active alert [1]
    for (const alert of alerts) {
      const currentPrice = prices[alert.pair];
      if (!currentPrice) continue;

      // Check if price has crossed the threshold
      const isHit =
        alert.condition === "ABOVE"
          ? currentPrice >= alert.target_price
          : currentPrice <= alert.target_price;

      if (isHit) {
        // a. Send the email notification via Resend [4]
        await resend.emails.send({
          from: 'Trading Dashboard <onboarding@resend.dev>',
          to: [alert.email],
          subject: `🚨 Price Alert Hit: ${alert.pair} is ${alert.condition.toLowerCase()} ${alert.target_price}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
              <h2 style="color: #6366f1; margin-bottom: 5px;">Price Alert Triggered!</h2>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 0; margin-bottom: 20px;">Your market target has been crossed in the cloud.</p>
              
              <div style="background-color: #020617; border: 1px solid #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace;">
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #94a3b8;">Asset:</strong> ${alert.pair}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #94a3b8;">Condition:</strong> Price went ${alert.condition.toLowerCase()}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #94a3b8;">Target Price:</strong> ${alert.target_price}</p>
                <p style="margin: 0; font-size: 14px;"><strong style="color: #6366f1;">Trigger Price:</strong> ${currentPrice}</p>
              </div>
              
              <p style="font-size: 12px; color: #64748b; margin-top: 25px;">Happy trading,<br><strong>Your Glide Dashboard Team</strong></p>
            </div>
          `,
        });

        // b. Mark alert as triggered in database so we don't send duplicate emails [1]
        await supabase
          .from("alerts")
          .update({ is_triggered: true })
          .eq("id", alert.id);

        triggeredAlerts.push({
          id: alert.id,
          pair: alert.pair,
          target: alert.target_price,
          triggered_at: currentPrice,
        });
      }
    }

    // 5. Return a clean processing report [1]
    return NextResponse.json({
      checked_count: alerts.length,
      triggered_count: triggeredAlerts.length,
      triggered_details: triggeredAlerts,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Error in check-alerts background cron job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}