import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game') || 'mines';

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isNewUser = user.gamesPlayedCount < 3;
    const rtpKey = `${game}_${isNewUser ? 'new' : 'old'}_rtp`;

    const setting = await prisma.settings.findUnique({
      where: { key: rtpKey }
    });

    let activeRtp = 50; // default
    if (setting) {
      activeRtp = parseFloat(setting.value);
    }

    return NextResponse.json({ activeRtp, isNewUser, gamesPlayedCount: user.gamesPlayedCount });
  } catch (error) {
    console.error("RTP Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
