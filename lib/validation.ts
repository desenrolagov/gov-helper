import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome muito longo."),
  email: z
    .string()
    .email("Email inválido.")
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres.")
    .max(100, "Senha muito longa."),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
  lgpdAccepted: z.boolean(),
});

export const serviceSchema = z.object({
  name: z.string().min(3, "Nome do serviço deve ter no mínimo 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  price: z.number().positive("Preço deve ser maior que zero"),
});

export const createOrderSchema = z.object({
  serviceId: z.string().min(1, "Serviço obrigatório"),
  termsAccepted: z
    .boolean()
    .refine((value) => value === true, {
      message: "Você precisa aceitar os Termos de Uso.",
    }),
  privacyAccepted: z
    .boolean()
    .refine((value) => value === true, {
      message: "Você precisa aceitar a Política de Privacidade.",
    }),
  legalVersion: z.string().optional(),
});