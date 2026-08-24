import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

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
