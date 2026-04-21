import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function getCurrentUser() {
  try {
    const session = await verifySession();

    if (!session || !session.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}