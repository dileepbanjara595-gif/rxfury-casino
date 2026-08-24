import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { identifier, method } = await req.json(); // method is 'email' or 'phone'

    if (!identifier) {
      return NextResponse.json({ error: "Identifier is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this identifier" }, { status: 404 });
    }

    // Generate a 6 digit mock OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTP.create({
      data: {
        email: method === "email" ? identifier : null,
        phone: method === "phone" ? identifier : null,
        code,
        expiresAt
      }
    });

    // In a real app, send this via SMS/Email
    // Here we just return it in development for easy testing
    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully",
      test_otp: code 
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
