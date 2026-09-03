import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topicId, isCompleted } = await req.json();

  if (!topicId) {
    return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const progress = await prisma.userProgress.upsert({
    where: {
      userId_topicId: {
        userId: user.id,
        topicId: topicId,
      }
    },
    update: {
      isCompleted: isCompleted
    },
    create: {
      userId: user.id,
      topicId: topicId,
      isCompleted: isCompleted
    }
  });

  return NextResponse.json(progress);
}
