import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Use the same exchange rates defined in frontend store (or fetch live from DB/API)
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USDT: 88.5,
  USDC: 88.5,
  BTC: 5500000,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId, action, betAmount, currency, multiplier } = await req.json();

    if (!currency || !EXCHANGE_RATES[currency]) {
      return NextResponse.json({ error: "Invalid or unsupported currency" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let updatedUser;

    if (action === 'PLACE') {
      if (!betAmount) return NextResponse.json({ error: "Missing betAmount" }, { status: 400 });
      const betInBase = betAmount * EXCHANGE_RATES[currency];

      if (user.mainWalletBalance < betInBase) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { mainWalletBalance: { decrement: betInBase } }
      });
    } 
    else if (action === 'CASHOUT') {
      if (!betAmount || !multiplier) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      
      const winInBase = (betAmount * multiplier) * EXCHANGE_RATES[currency];
      
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { mainWalletBalance: { increment: winInBase } }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newBalanceBase: updatedUser.mainWalletBalance,
      newBalanceCurrency: updatedUser.mainWalletBalance / EXCHANGE_RATES[currency],
      currency,
    });

  } catch (error) {
    console.error("Betting error:", error);
    return NextResponse.json({ error: "Failed to process bet" }, { status: 500 });
  }
}
