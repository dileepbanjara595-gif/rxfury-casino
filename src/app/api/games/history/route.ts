import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameName = searchParams.get('game') || 'Aviator';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const sessions = await prisma.gameSession.findMany({
      where: {
        gameName,
        status: "COMPLETED",
        resultOutcome: { not: null }
      },
      orderBy: { completedAt: 'desc' },
      take: limit
    });

    const history = sessions.map(s => {
      let parsedOutcome = s.resultOutcome;
      try {
        if (s.resultOutcome && (s.resultOutcome.startsWith('{') || s.resultOutcome.startsWith('['))) {
          parsedOutcome = JSON.parse(s.resultOutcome);
        }
      } catch (e) {}

      return {
        sessionId: s.id,
        result: parsedOutcome,
        completedAt: s.completedAt
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("History Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
