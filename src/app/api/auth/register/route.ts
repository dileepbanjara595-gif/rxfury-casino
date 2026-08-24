import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Helper to generate FURY-XXXXX ID
const generateSystematicId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit number
  return `FURY-${randomNum}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, authMethod, promoCode } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Safely check if user exists based on authMethod
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
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate Unique ID
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

    // Create User
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
        phone: newUser.phone,
        bonusWalletBalance: newUser.bonusWalletBalance,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}