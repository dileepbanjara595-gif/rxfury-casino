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

    const userId = session.user.id;

    // 1. Fetch total games count
    const totalGames = await prisma.gameHistory.count({
      where: { userId }
    });

    // 2. Fetch total won amount and win count
    const winningGames = await prisma.gameHistory.findMany({
      where: { userId, winLossStatus: 'WIN' },
      select: { payoutAmount: true }
    });

    const totalWon = winningGames.reduce((acc, game) => acc + game.payoutAmount, 0);
    const totalWins = winningGames.length;
    const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';

    // 3. Fetch recent activity (merge transactions and games)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentGames = await prisma.gameHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Format them into a combined activity list
    const combinedActivity = [
      ...recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.type === 'DEPOSIT' || tx.type === 'BONUS' || tx.type === 'RAKEBACK' ? '+' + tx.amount : '-' + tx.amount,
        rawAmount: tx.amount,
        date: tx.createdAt,
        status: tx.status === 'APPROVED' ? 'Completed' : tx.status === 'PENDING' ? 'Processing' : 'Failed',
        isGame: false
      })),
      ...recentGames.map(game => ({
        id: game.id,
        type: game.gameName + ' ' + game.winLossStatus,
        amount: game.winLossStatus === 'WIN' ? '+' + game.payoutAmount : '-' + game.betAmount,
        rawAmount: game.winLossStatus === 'WIN' ? game.payoutAmount : game.betAmount,
        date: game.createdAt,
        status: 'Completed',
        isGame: true
      }))
    ];

    // Sort combined by date descending and take top 10
    combinedActivity.sort((a, b) => b.date.getTime() - a.date.getTime());
    const finalActivity = combinedActivity.slice(0, 10).map(item => ({
      ...item,
      date: item.date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }));

    // Format User Member Since
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });
    
    const memberSince = user?.createdAt.toLocaleString('en-US', { month: 'short', year: 'numeric' }) || 'Recently';

    return NextResponse.json({
      stats: {
        totalGames,
        totalWon,
        winRate
      },
      activityHistory: finalActivity,
      memberSince
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile stats" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, dob, profilePhoto } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        dob: dob ? new Date(dob) : null,
        profilePhoto
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        dob: updatedUser.dob,
        profilePhoto: updatedUser.profilePhoto
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

