import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { level, price } = body;

    if (!level || price === undefined || price === null) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const targetLevel = parseInt(String(level).replace("L", ""), 10);
    const numericPrice = parseFloat(price);

    if (isNaN(targetLevel) || isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "Invalid format for level or price" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { vipLevel: true } // securely get current level directly from DB
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentLevel = user.vipLevelId || 0;

    if (targetLevel <= currentLevel) {
      return NextResponse.json({ error: "Already at or above this VIP level" }, { status: 400 });
    }

    if (user.mainWalletBalance < numericPrice) {
      return NextResponse.json({ error: "Insufficient wallet balance", code: "INSUFFICIENT_FUNDS" }, { status: 400 });
    }

    // Verify if the target level actually exists in the VipLevel table
    const vipLevelExists = await prisma.vipLevel.findUnique({
      where: { id: targetLevel }
    });

    if (!vipLevelExists) {
      // Rather than crashing with foreign key constraint, handle it gracefully
      return NextResponse.json({ error: "The requested VIP level does not exist in the database." }, { status: 400 });
    }

    // Deduct balance and update VIP level atomically using prisma transaction
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          mainWalletBalance: { decrement: numericPrice },
          vipLevelId: targetLevel
        }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL", // Technically a purchase
          amount: numericPrice,
          status: "APPROVED",
          utrOrHash: `VIP_UPGRADE_L${targetLevel}`
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      newLevel: updatedUser.vipLevelId, 
      newBalance: updatedUser.mainWalletBalance 
    });

  } catch (error: any) {
    console.error("VIP Upgrade Error:", error.message || error);
    
    // Catch common prisma foreign key or validation errors safely
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Foreign key constraint failed. VIP level likely does not exist." }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal Server Error", message: error.message || "Unknown error" }, { status: 500 });
  }
}
