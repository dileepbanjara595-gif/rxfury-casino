import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        systematicId: true,
        email: true,
        phone: true,
        mainWalletBalance: true,
        bonusWalletBalance: true,
        vipLevel: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
