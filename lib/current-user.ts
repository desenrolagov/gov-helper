import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function getCurrentUser() {
  try {
    const session = await verifySession();

    // 🔒 Se não houver sessão válida
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

    // 🔒 Se usuário não existir (ex: deletado)
    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);

    // 🔥 MUITO IMPORTANTE: nunca quebrar o server
    return null;
  }
}