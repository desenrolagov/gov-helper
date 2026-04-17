import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = "Não autenticado.") {
  return jsonError(message, 401);
}

export function forbidden(message = "Acesso negado.") {
  return jsonError(message, 403);
}

export function notFound(message = "Recurso não encontrado.") {
  return jsonError(message, 404);
}

export function badRequest(message = "Requisição inválida.") {
  return jsonError(message, 400);
}

export function serverError(message = "Erro interno do servidor.") {
  return jsonError(message, 500);
}