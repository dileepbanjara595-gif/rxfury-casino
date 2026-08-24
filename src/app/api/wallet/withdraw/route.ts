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
    const { amount, details } = body;

    if (!amount || amount < 500 || !details) {
      return NextResponse.json({ error: "Invalid amount or missing details" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.mainWalletBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Deduct balance immediately to prevent double spending
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mainWalletBalance: { decrement: amount } }
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "WITHDRAWAL",
        amount: parseFloat(amount),
        utrOrHash: details, // Reusing utrOrHash to store payout details
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("Withdraw Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
