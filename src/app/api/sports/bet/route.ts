import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { distributeCommission } from '@/lib/affiliate';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { matchId, selection, odds, stake } = body;

    if (!matchId || !selection || !odds || stake <= 0) {
      return NextResponse.json({ error: "Invalid bet parameters" }, { status: 400 });
    }

    // Process inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Match Status & Suspension
      const match = await tx.sportsMatch.findUnique({ where: { betradarId: matchId } });
      if (!match) throw new Error("Match not found");
      if (match.isSuspended) throw new Error("Match is suspended by Admin");

      // 2. Check Wallet Balance
      const user = await tx.user.findUnique({ where: { id: session.user.id } });
      if (!user) throw new Error("User not found");
      if (user.mainWalletBalance < stake) throw new Error("Insufficient balance");

      // 3. Deduct Balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { mainWalletBalance: { decrement: stake } }
      });

      // 4. Create Bet Record
      // First ensure market exists (or mock it since we are pulling dynamically)
      // For simplicity in this integration, we link to a dummy market or create it on the fly
      let market = await tx.sportsMarket.findFirst({ where: { matchId: match.id, type: "1X2" } });
      if (!market) {
         market = await tx.sportsMarket.create({
            data: { matchId: match.id, type: "1X2", oddsData: {} }
         });
      }

      if (market.isSuspended) throw new Error("Market is suspended");

      const bet = await tx.sportsBet.create({
        data: {
          userId: user.id,
          matchId: match.id,
          marketId: market.id,
          selection,
          odds: parseFloat(odds),
          stake,
          potentialPayout: stake * parseFloat(odds),
          status: "PENDING"
        }
      });

      return { betId: bet.id, newBalance: updatedUser.mainWalletBalance };
    });

    // Fire affiliate commission after bet is placed
    distributeCommission(session.user.id, stake).catch(console.error);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Sports Bet Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
