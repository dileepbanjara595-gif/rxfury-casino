import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Helper to generate FURY-XXXXX ID
const generateSystematicId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit number
  return 'FURY-' + randomNum;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, authMethod, promoCode, otp } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json({ error: "OTP is required for registration" }, { status: 400 });
    }

    // 1. Verify OTP
    const validOtp = await prisma.oTP.findFirst({
      where: {
        email: identifier,
        code: otp,
        isUsed: false,
        expiresAt: { gt: new Date() } // Must not be expired
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 2. Check existing user
    let existingUser = null;
    if (authMethod === "email") {
      existingUser = await prisma.user.findUnique({
        where: { email: identifier },
      });
    } else if (authMethod === "phone") {
      existingUser = await prisma.user.findUnique({
        where: { phone: identifier },
      });
    } else {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier },
          ],
        },
      });
    }

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ error: "User already exists and is verified. Please log in." }, { status: 409 });
      }
      // If user exists but is NOT verified, we will update their record instead of failing.
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check for Promo Code
    let initialBonus = 0;
    if (promoCode && promoCode.toLowerCase() === "fury50") {
      initialBonus = 50;
    }

    // Check for Referral
    let referredById = null;
    if (promoCode && promoCode.toLowerCase() !== "fury50") {
      const referrer = await prisma.user.findUnique({
        where: { systematicId: promoCode.toUpperCase() }
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    let userRecord;

    if (existingUser) {
      // 3A. Update unverified user
      userRecord = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          isVerified: true,
          bonusWalletBalance: initialBonus,
          referredById
        }
      });
    } else {
      // 3B. Generate Unique ID and create new user
      let systematicId = generateSystematicId();
      let isUnique = false;
      while (!isUnique) {
        const checkId = await prisma.user.findUnique({ where: { systematicId } });
        if (!checkId) {
          isUnique = true;
        } else {
          systematicId = generateSystematicId();
        }
      }

      userRecord = await prisma.user.create({
        data: {
          systematicId,
          email: authMethod === "email" ? identifier : null,
          phone: authMethod === "phone" ? identifier : null,
          passwordHash,
          bonusWalletBalance: initialBonus,
          referredById,
          isVerified: true
        },
      });
    }

    // 4. Mark OTP as used
    await prisma.oTP.update({
      where: { id: validOtp.id },
      data: { isUsed: true }
    });

    return NextResponse.json({
      message: "User registered and verified successfully",
      user: {
        id: userRecord.id,
        systematicId: userRecord.systematicId,
        email: userRecord.email,
        phone: userRecord.phone,
        bonusWalletBalance: userRecord.bonusWalletBalance,
        isVerified: userRecord.isVerified
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message || String(error) }, { status: 500 });
  }
}
