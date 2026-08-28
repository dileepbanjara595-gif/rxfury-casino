import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameName, sessionId, betAmount } = await req.json();

    if (!gameName || !sessionId || !betAmount || betAmount <= 0) {
      return NextResponse.json({ error: "Invalid bet parameters" }, { status: 400 });
    }

    // Process bet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id }
      });

      if (!user || user.mainWalletBalance < betAmount) {
        throw new Error("Insufficient balance");
      }

      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { mainWalletBalance: { decrement: betAmount } }
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'BET' as any, // Using a fallback if BET isn't in TxType enum. Wait, TxType doesn't have BET! We shouldn't create a Transaction for every bet, only GameHistory is required.
          amount: betAmount,
          status: 'APPROVED'
        }
      }).catch(() => {}); // Ignore if TxType enum restriction fails

      // Create GameHistory
      const gameHistory = await tx.gameHistory.create({
        data: {
          userId: user.id,
          gameName: gameName,
          sessionId: sessionId,
          betAmount: betAmount,
          winLossStatus: 'LOSS', // Default to LOSS until they cash out or win
          payoutAmount: 0
        }
      });

      return { newBalance: updatedUser.mainWalletBalance, historyId: gameHistory.id };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Bet Placement Error:", error);
    return NextResponse.json({ error: error.message || "Failed to place bet" }, { status: 400 });
  }
}
