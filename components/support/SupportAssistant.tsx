"use client";

import { useMemo, useState } from "react";
import {
  getAssistantReply,
  getFaqByStage,
  getSupportMessageByStage,
  getSupportStageLabel,
  type SupportStage,
} from "@/lib/support";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type Props = {
  stage?: SupportStage;
};

export default function SupportAssistant({
  stage = "GENERAL",
}: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-assistant",
      role: "assistant",
      text: getSupportMessageByStage(stage),
    },
  ]);

  const faqItems = useMemo(() => getFaqByStage(stage), [stage]);

  function handleSend() {
    const value = input.trim();

    if (!value) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: value,
    };

    const assistantMessage: Message = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: getAssistantReply(value, stage),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  }

  function handleFaqClick(question: string, answer: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `faq-user-${Date.now()}`,
        role: "user",
        text: question,
      },
      {
        id: `faq-assistant-${Date.now() + 1}`,
        role: "assistant",
        text: answer,
      },
    ]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-sm font-semibold text-blue-600">Suporte inteligente</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Etapa atual: {getSupportStageLabel(stage)}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecione uma dúvida comum ou fale com o assistente abaixo.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleFaqClick(item.question, item.answer)}
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">
                {item.question}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Clique para ver a resposta no assistente
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">
            Assistente de suporte
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Respostas rápidas com base na etapa do pedido.
          </p>
        </div>

        <div className="max-h-[460px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Digite sua dúvida..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />

          <button
            type="button"
            onClick={handleSend}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Enviar
          </button>
        </div>
      </section>
    </div>
  );
}