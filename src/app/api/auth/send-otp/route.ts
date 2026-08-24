import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // In a real app, hash the OTP. For MVP, we store plaintext for easy verification
    const { error: dbError } = await supabase
      .from('otps')
      .insert([
        { email, code: otp, expiresAt, isUsed: false }
      ]);

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: '"RXFURY Security" <noreply@rxfury.com>',
      to: email,
      subject: 'Your RXFURY Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1d29; color: #ffffff; border-radius: 10px;">
          <h2 style="color: #eab308; text-align: center; text-transform: uppercase; letter-spacing: 2px;">RXFURY Security</h2>
          <p style="font-size: 16px; color: #d1d5db;">Hello,</p>
          <p style="font-size: 16px; color: #d1d5db;">You have requested to reset your password. Please use the following 6-digit OTP code to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #000000; padding: 15px 30px; border-radius: 8px; border: 1px solid #374151; color: #eab308;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #9ca3af; text-align: center;">This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'OTP sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
  }
}
