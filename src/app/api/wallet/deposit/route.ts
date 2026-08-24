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
    const { amount, utr } = body;

    if (!amount || amount < 100 || !utr) {
      return NextResponse.json({ error: "Invalid amount or missing UTR" }, { status: 400 });
    }

    // Check if UTR already exists to prevent duplicate submissions
    const existingTx = await prisma.transaction.findFirst({
      where: { utrOrHash: utr, type: "DEPOSIT" },
    });

    if (existingTx) {
      return NextResponse.json({ error: "UTR already submitted" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "DEPOSIT",
        amount: parseFloat(amount),
        utrOrHash: utr,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("Deposit Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
