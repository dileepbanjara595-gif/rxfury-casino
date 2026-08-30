import { distributeCommission } from '@/lib/affiliate';
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let whereClause = {};
    if (status) {
      whereClause = { status };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            systematicId: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Admin Transactions GET Error:", error);
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
    const { id, action } = body; // action = "APPROVE" or "REJECT"

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction not found or already processed" }, { status: 400 });
    }

    let newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const result = await prisma.$transaction(async (tx: any) => {
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: { status: newStatus }
      });

      if (action === 'APPROVE' && transaction.type === 'DEPOSIT') {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { mainWalletBalance: { increment: transaction.amount } }
        });
      }

      if (action === 'REJECT' && transaction.type === 'WITHDRAWAL') {
        // Refund the user's wallet if withdrawal is rejected
        await tx.user.update({
          where: { id: transaction.userId },
          data: { mainWalletBalance: { increment: transaction.amount } }
        });
      }

      return updatedTx;
    });

    if (action === 'APPROVE' && transaction.type === 'DEPOSIT') {
       distributeCommission(transaction.userId, transaction.amount).catch(console.error);
    }
    
    return NextResponse.json({ success: true, transaction: result });
  } catch (error) {
    console.error("Admin Transactions POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
