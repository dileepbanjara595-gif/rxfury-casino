import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matches = await prisma.sportsMatch.findMany({
      orderBy: { startTime: 'desc' },
      include: {
         _count: {
            select: { bets: true }
         }
      }
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Admin Sports GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, matchId, isSuspended } = body;

    if (action === 'TOGGLE_SUSPEND' && matchId) {
      const match = await prisma.sportsMatch.update({
         where: { id: matchId },
         data: { isSuspended }
      });
      return NextResponse.json({ success: true, match });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("Admin Sports POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
