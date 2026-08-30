import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
       const user = await tx.user.findUnique({ where: { id: userId } });
       if (!user) throw new Error("User not found");

       if (user.affiliateWalletBalance <= 0) {
          throw new Error("No affiliate balance available to claim");
       }

       const amountToClaim = user.affiliateWalletBalance;

       const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
             affiliateWalletBalance: 0,
             mainWalletBalance: { increment: amountToClaim }
          }
       });

       return { amount: amountToClaim, newBalance: updatedUser.mainWalletBalance };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error("Affiliate Claim Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { affiliateWalletBalance: true }
    });

    // Also fetch the downline activity
    const commissions = await prisma.affiliateCommission.findMany({
      where: { userId: session.user.id },
      include: {
         fromUser: { select: { systematicId: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
       affiliateWalletBalance: user?.affiliateWalletBalance || 0,
       recentCommissions: commissions.map(c => ({
          id: c.id,
          userId: c.fromUser.systematicId,
          tier: `L${c.tier}`,
          amount: c.amount,
          createdAt: c.createdAt
       }))
    });

  } catch (error) {
    console.error("Affiliate Get Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
