import prisma from "@/lib/prisma";

// Tiers: L1 = 2%, L2 = 1%, L3 = 0.5%
const COMMISSION_RATES = {
  1: 0.02,
  2: 0.01,
  3: 0.005
};

export async function distributeCommission(userId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        referredById: true 
      }
    });

    if (!user || !user.referredById) return;

    let currentReferrerId = user.referredById;
    
    // Distribute up to 3 levels
    for (let level = 1; level <= 3; level++) {
       if (!currentReferrerId) break;

       const referrer = await prisma.user.findUnique({
          where: { id: currentReferrerId },
          select: { id: true, referredById: true }
       });

       if (!referrer) break;

       const commissionAmount = amount * COMMISSION_RATES[level as keyof typeof COMMISSION_RATES];

       if (commissionAmount > 0.01) { // minimum threshold
          await prisma.$transaction([
             prisma.affiliateCommission.create({
                data: {
                   userId: referrer.id,
                   fromUserId: user.id,
                   tier: level,
                   amount: commissionAmount
                }
             }),
             prisma.user.update({
                where: { id: referrer.id },
                data: { affiliateWalletBalance: { increment: commissionAmount } }
             })
          ]);
       }

       currentReferrerId = referrer.referredById;
    }

  } catch (error) {
    console.error("Commission Distribution Error:", error);
  }
}
