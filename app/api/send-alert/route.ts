import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, pair, targetPrice, condition } = await req.json();

    const data = await resend.emails.send({
      from: 'Trading Dashboard <onboarding@resend.dev>', // You can customize this later
      to: [email],
      subject: `🚨 Alert Triggered: ${pair} ${condition} ${targetPrice}`,
      html: `<h1>Price Alert</h1><p>Your alert for <strong>${pair}</strong> at <strong>${targetPrice}</strong> has been triggered.</p>`,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}