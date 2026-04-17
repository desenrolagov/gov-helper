import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);

    return NextResponse.json(
      { error: "Erro ao buscar usuário atual" },
      { status: 500 }
    );
  }
}