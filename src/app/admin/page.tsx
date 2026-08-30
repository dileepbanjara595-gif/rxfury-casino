export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboardPage() {
  const totalUsers = await prisma.user.count();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get Deposits (last 7 days)
  const depositsData = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      type: 'DEPOSIT',
      status: 'APPROVED',
      createdAt: { gte: sevenDaysAgo }
    }
  });

  // Get Withdrawals (last 7 days)
  const withdrawalsData = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      type: 'WITHDRAWAL',
      status: 'APPROVED',
      createdAt: { gte: sevenDaysAgo }
    }
  });

  const totalDeposits7d = depositsData._sum.amount || 0;
  const totalWithdrawals7d = withdrawalsData._sum.amount || 0;
  const netGGR = totalDeposits7d - totalWithdrawals7d;

  // Chart Data: Group deposits and withdrawals by day for the last 7 days
  const chartData = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - i);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyDeposits = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'DEPOSIT',
        status: 'APPROVED',
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    const dailyWithdrawals = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'WITHDRAWAL',
        status: 'APPROVED',
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    chartData.push({
      name: days[startOfDay.getDay()],
      revenue: dailyDeposits._sum.amount || 0,
      payouts: dailyWithdrawals._sum.amount || 0,
    });
  }

  return (
    <DashboardClient 
      totalUsers={totalUsers}
      totalDeposits7d={totalDeposits7d}
      totalWithdrawals7d={totalWithdrawals7d}
      netGGR={netGGR}
      chartData={chartData}
    />
  );
}
