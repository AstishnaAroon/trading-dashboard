import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    // Safety check: If the key is missing at runtime, return a clean JSON error
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing RESEND_API_KEY environment variable on server.' }, 
        { status: 500 }
      );
    }

    // Initialize Resend inside the POST function to prevent build-time crashes
    const resend = new Resend(apiKey);
    const { email, pair, targetPrice, condition } = await req.json();

    const data = await resend.emails.send({
      from: 'Trading Dashboard <onboarding@resend.dev>',
      to: [email],
      subject: `🚨 Alert Triggered: ${pair} ${condition} ${targetPrice}`,
      html: `<h1>Price Alert</h1><p>Your alert for <strong>${pair}</strong> at <strong>${targetPrice}</strong> has been triggered.</p>`,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}