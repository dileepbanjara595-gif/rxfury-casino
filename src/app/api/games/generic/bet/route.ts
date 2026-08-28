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

    const { gameName, betAmount } = await req.json();

    if (!gameName || !betAmount || betAmount <= 0) {
      return NextResponse.json({ error: "Invalid bet parameters" }, { status: 400 });
    }

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

      // Generate a client-side session ID for generic games
      const sessionId = `GEN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Create GameHistory (Pending state)
      const gameHistory = await tx.gameHistory.create({
        data: {
          userId: user.id,
          gameName: gameName,
          sessionId: sessionId,
          betAmount: betAmount,
          winLossStatus: 'LOSS', // Default to LOSS until game resolves
          payoutAmount: 0
        }
      });

      return { newBalance: updatedUser.mainWalletBalance, historyId: gameHistory.id, sessionId };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Generic Bet Error:", error);
    return NextResponse.json({ error: error.message || "Failed to place bet" }, { status: 400 });
  }
}
