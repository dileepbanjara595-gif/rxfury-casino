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

    const { historyId, cashoutMultiplier } = await req.json();

    if (!historyId || !cashoutMultiplier) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const bet = await tx.gameHistory.findUnique({
        where: { id: historyId },
        include: { user: true }
      });

      if (!bet || bet.userId !== session.user.id) {
        throw new Error("Bet not found");
      }
      
      if (bet.winLossStatus === 'WIN') {
        throw new Error("Already cashed out");
      }

      const gameSession = await tx.gameSession.findUnique({
        where: { id: bet.sessionId }
      });

      if (!gameSession || !gameSession.resultOutcome) {
        throw new Error("Invalid session");
      }

      const now = Date.now();
      const sessionAgeSecs = (now - gameSession.createdAt.getTime()) / 1000;
      
      let maxAllowedMultiplier = 1.00;
      if (sessionAgeSecs > 15) {
         const flightTime = sessionAgeSecs - 15;
         maxAllowedMultiplier = Math.exp(0.1 * flightTime);
      }

      const crashMultiplier = parseFloat(gameSession.resultOutcome);

      if (cashoutMultiplier > crashMultiplier || cashoutMultiplier > (maxAllowedMultiplier + 0.5)) {
         throw new Error("Cashout rejected: Game crashed or invalid multiplier");
      }

      const payoutAmount = bet.betAmount * cashoutMultiplier;

      await tx.gameHistory.update({
        where: { id: bet.id },
        data: {
          winLossStatus: 'WIN',
          multiplier: cashoutMultiplier,
          payoutAmount: payoutAmount
        }
      });

      const updatedUser = await tx.user.update({
        where: { id: bet.userId },
        data: { mainWalletBalance: { increment: payoutAmount } }
      });

      return { newBalance: updatedUser.mainWalletBalance, payoutAmount };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Cashout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to cash out" }, { status: 400 });
  }
}
