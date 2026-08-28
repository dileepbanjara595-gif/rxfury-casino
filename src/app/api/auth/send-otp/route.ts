import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

// Use Resend for emails
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type = 'register' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Validate based on type
    if (type === 'register') {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        if (existingUser.isVerified) {
          return NextResponse.json({ error: 'Email already registered. Please log in.' }, { status: 409 });
        }
      }
    } else if (type === 'forgot_password') {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 });
      }
    }

    // Save or update OTP in Prisma database
    await prisma.oTP.create({
      data: {
        email,
        code: otpCode,
        type,
        expiresAt,
        isUsed: false
      }
    });

    // Check for API Key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy_key') {
      return NextResponse.json({ error: 'Server configuration error', details: 'RESEND_API_KEY is not configured.' }, { status: 500 });
    }

    // Send email via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: '"RXFURY" <team@rxfurygame.com>',
        to: [email],
        subject: 'Your RXFURY Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1d29; color: #ffffff; border-radius: 10px;">
            <h2 style="color: #3b82f6; text-align: center; text-transform: uppercase; letter-spacing: 2px;">RXFURY Verification</h2>
            <p style="font-size: 16px; color: #d1d5db;">Hello,</p>
            <p style="font-size: 16px; color: #d1d5db;">Please use the following 6-digit OTP code to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #000000; padding: 15px 30px; border-radius: 8px; border: 1px solid #374151; color: #3b82f6;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 14px; color: #9ca3af; text-align: center;">This code will expire in 10 minutes.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API Error object:", error);
        return NextResponse.json({ error: 'Failed to send OTP email.', details: error.message }, { status: 500 });
      }
    } catch (resendErr: any) {
      console.error("Resend execution error:", resendErr);
      return NextResponse.json({ error: 'Failed to execute email service.', details: resendErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message || String(error) }, { status: 500 });
  }
}


