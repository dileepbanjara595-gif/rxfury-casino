import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
     const history = await prisma.gameHistory.findMany({
       where: { gameName: 'Teen Patti' },
       orderBy: { createdAt: 'desc' },
       take: 50
     });
     return NextResponse.json(history);
  } catch (error) {
     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // In production we would secure this webhook with a secret token
    if (!data.roomId || !data.gameName) {
       return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Ensure bot users exist
    if (data.winnerId && data.winnerId.startsWith('bot-')) {
       await prisma.user.upsert({
         where: { id: data.winnerId },
         update: {},
         create: { 
           id: data.winnerId, 
           systematicId: 'BOT-' + data.winnerId, 
           email: data.winnerId + '@rxfurygame.com', 
           passwordHash: 'N/A',
           role: 'USER' 
         }
       });
    }

    await prisma.gameHistory.create({
      data: {
         userId: data.winnerId || 'bot-1',
         gameName: data.gameName,
         sessionId: data.sessionId,
         betAmount: data.potAmount || 0,
         winLossStatus: 'WIN',
         payoutAmount: data.potAmount || 0,
         roomId: data.roomId,
         winnerId: data.winnerId,
         winnerName: data.winnerName,
         potAmount: data.potAmount,
         playersData: JSON.stringify(data.playersData)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
