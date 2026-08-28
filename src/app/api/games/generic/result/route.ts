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

    const { historyId, winLossStatus, payoutAmount, multiplier } = await req.json();

    if (!historyId || !winLossStatus) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const bet = await tx.gameHistory.findUnique({
        where: { id: historyId },
        include: { user: true }
      });

      if (!bet || bet.userId !== session.user.id) {
        throw new Error("Bet not found or unauthorized");
      }
      
      if (bet.winLossStatus === 'WIN') {
        throw new Error("Already resolved as WIN");
      }

      await tx.gameHistory.update({
        where: { id: bet.id },
        data: {
          winLossStatus: winLossStatus,
          multiplier: multiplier || (payoutAmount / bet.betAmount),
          payoutAmount: payoutAmount || 0
        }
      });

      let updatedUser = bet.user;
      if (winLossStatus === 'WIN' && payoutAmount > 0) {
        updatedUser = await tx.user.update({
          where: { id: bet.userId },
          data: { mainWalletBalance: { increment: payoutAmount } }
        });
      }

      return { newBalance: updatedUser.mainWalletBalance, payoutAmount };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Generic Result Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit result" }, { status: 400 });
  }
}
