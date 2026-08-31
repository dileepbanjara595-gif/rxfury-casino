import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { distributeCommission } from '@/lib/affiliate';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const eventType = payload.event || payload.type;
    if (eventType !== 'DEPOSIT_COMPLETED' && eventType !== 'deposit.success') {
      return NextResponse.json({ success: true, message: 'Event ignored' }, { status: 200 });
    }

    // Rhino.fi returns the custom metadata passed during SDA creation
    const userId = payload.metadata?.platformUserId || payload.metadata?.userId || payload.userId;
    const rawAmount = payload.amount;
    const currency = payload.currency || payload.token || 'USDT';

    if (!userId || !rawAmount) {
      console.error('Webhook Error: Missing required fields', payload);
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const amountToCredit = parseFloat(rawAmount.toString());
    if (isNaN(amountToCredit) || amountToCredit <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    console.log(`Processing deposit of ${amountToCredit} ${currency} for user ${userId}`);
    const transactionId = payload.transactionId || payload.transactionHash || payload.id || `dep_${Date.now()}`;

    // Process via Prisma transaction
    await prisma.$transaction(async (tx) => {
      // 1. Credit the user balance safely
      const user = await tx.user.update({
        where: { id: userId },
        data: { mainWalletBalance: { increment: amountToCredit } }
      });

      // 2. Create the Transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount: amountToCredit,
          status: 'SUCCESS', // Assuming it's already successful from webhook
          currency: currency,
          gateway: 'Rhino.fi',
          reference: transactionId
        }
      });
    });
    
    // Distribute affiliate commission for deposit
    distributeCommission(userId, amountToCredit, 'DEPOSIT').catch(console.error);

    console.log(`Successfully credited ${amountToCredit} ${currency} to user ${userId} via Rhino Webhook`);
    return NextResponse.json({ success: true, message: 'Deposit successfully processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET() { 
  return NextResponse.json({ success: true, message: 'Rhino Webhook is active and waiting for live transactions.' }, { status: 200 }); 
}
