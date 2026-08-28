import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const generateSystematicId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `FURY-${randomNum}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, otp, authMethod, promoCode } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if user ALREADY exists and is fully registered
    const existingUser = await prisma.user.findUnique({
      where: { email: identifier },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists. Please sign in." }, { status: 409 });
    }

    // NOTE: Yaha aap apna OTP verification check laga sakte hain 
    // (Jaise agar aapne OTP table me OTP store kiya hai toh use verify karein)

    // 2. Hash password safely
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Generate Unique Systematic ID
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

    // 4. Handle Promo Code / Bonus
    let initialBonus = 0;
    if (promoCode && promoCode.toLowerCase() === "fury50") {
      initialBonus = 50;
    }

    let referredById = null;
    if (promoCode && promoCode.toLowerCase() !== "fury50") {
      const referrer = await prisma.user.findUnique({
        where: { systematicId: promoCode.toUpperCase() }
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // 5. Create NEW User in Database ONLY NOW
    const newUser = await prisma.user.create({
      data: {
        systematicId,
        email: authMethod === "email" ? identifier : null,
        phone: authMethod === "phone" ? identifier : null,
        passwordHash,
        bonusWalletBalance: initialBonus,
        referredById,
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        systematicId: newUser.systematicId,
        email: newUser.email,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}