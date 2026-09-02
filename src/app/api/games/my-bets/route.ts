import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gameName = searchParams.get("game");
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    if (!gameName) {
      return NextResponse.json({ error: "Game name required" }, { status: 400 });
    }

    // Fetch user's history for this game/mode
    const myBets = await prisma.gameHistory.findMany({
      where: {
        userId: session.user.id,
        gameName: gameName,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formattedBets = myBets.map(bet => {
      let selection = null;
      try {
        if (bet.playersData && typeof bet.playersData === "string") {
          const pd = JSON.parse(bet.playersData);
          selection = pd.selection;
        } else if (bet.playersData && typeof bet.playersData === "object") {
          selection = (bet.playersData as any).selection;
        }
      } catch (e) {}

      // If selection is an object (e.g. { type: 'NUMBER', value: '8', color: 'Red' }) 
      // return the value property or standard string fallback
      let betSelectionString = selection;
      if (selection && typeof selection === 'object' && selection.value) {
        betSelectionString = selection.value;
      } else if (selection && typeof selection === 'object' && selection.color) {
        betSelectionString = selection.color;
      }

      return {
        id: bet.id,
        period: bet.sessionId,
        selection: betSelectionString || "Unknown",
        amount: bet.betAmount,
        winLossStatus: bet.winLossStatus,
        payoutAmount: bet.payoutAmount,
        createdAt: bet.createdAt
      };
    });

    return NextResponse.json({ success: true, myBets: formattedBets });
  } catch (error: any) {
    console.error("My Bets Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
