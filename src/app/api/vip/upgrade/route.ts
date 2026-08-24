import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level, price } = await req.json();

    if (!level || !price) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const targetLevel = parseInt(level.replace("L", ""));
    // Fix: use vipLevelId instead of vipLevel to match session type
    const currentLevel = (session.user as any).vipLevelId || 0;

    if (targetLevel <= currentLevel) {
      return NextResponse.json({ error: "Already at or above this VIP level" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.mainWalletBalance < price) {
      return NextResponse.json({ error: "Insufficient wallet balance", code: "INSUFFICIENT_FUNDS" }, { status: 400 });
    }

    // Deduct balance and update VIP level atomically using vipLevelId
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mainWalletBalance: { decrement: price },
        vipLevelId: targetLevel
      }
    });

    // Also record this as a transaction for audit trail
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL", // Technically a purchase
        amount: price,
        status: "APPROVED",
        utrOrHash: `VIP_UPGRADE_${level}`
      }
    });

    return NextResponse.json({ success: true, newLevel: targetLevel, newBalance: user.mainWalletBalance - price });

  } catch (error) {
    console.error("VIP Upgrade Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}