import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mainWalletBalance: true }
    });

    return NextResponse.json({
      mainWalletBalance: user?.mainWalletBalance || 0,
      affiliateBalance: 0
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
