import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, amount } = body;

    if (!email || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid email or amount" }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
    }

    // Process transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          amount: amount,
          status: "APPROVED",
          method: "Admin Manual Deposit",
        }
      });

      // 2. Add to user wallet
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          mainWalletBalance: {
            increment: amount
          }
        }
      });

      return { transaction, updatedUser };
    });

    return NextResponse.json({ success: true, newBalance: result.updatedUser.mainWalletBalance });
  } catch (error) {
    console.error("Admin Manual Transfer Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
