import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { identifier, code, newPassword } = await req.json();

    if (!identifier || !code || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify OTP
    const validOtp = await prisma.oTP.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ],
        code: code,
        expiresAt: { gt: new Date() } // Must not be expired
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Find User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    // Delete used OTP
    await prisma.oTP.delete({ where: { id: validOtp.id } });

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
