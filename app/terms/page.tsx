import { getLegalVersionLabel } from "@/lib/legal";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
        <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
          Documento institucional
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Termos de Uso
        </h1>

        <p className="mt-2 text-sm text-white/70">
          Versão vigente: {getLegalVersionLabel()}
        </p>

        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
          <strong>Atenção:</strong> a DesenrolaGov atua como assessoria privada
          e não possui vínculo com órgãos públicos.
        </div>

        <div className="mt-8 space-y-6 text-sm leading-7 text-white/80">
          <section>
            <h2 className="text-lg font-bold text-white">1. Objeto</h2>
            <p className="mt-2">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma
              DesenrolaGov, incluindo cadastro, contratação de serviços,
              acompanhamento de pedidos, envio de documentos e entrega de
              resultados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              2. Natureza da atividade
            </h2>
            <p className="mt-2">
              A DesenrolaGov presta assessoria privada de apoio operacional,
              orientação e organização do fluxo de atendimento. A plataforma não
              representa órgão público, autarquia, repartição oficial ou canal
              governamental.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              3. Responsabilidade do usuário
            </h2>
            <p className="mt-2">
              O usuário se compromete a fornecer informações verdadeiras, manter
              seus dados atualizados e enviar documentos válidos, legíveis e
              compatíveis com o serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">4. Fluxo do serviço</h2>
            <p className="mt-2">
              A contratação segue o fluxo operacional da plataforma, incluindo
              criação do pedido, pagamento, envio de documentos, análise e
              conclusão conforme o tipo de serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">5. Pagamentos</h2>
            <p className="mt-2">
              Atualmente, a plataforma pode aceitar pagamento via Pix. A
              confirmação do pedido e a evolução do fluxo dependem da validação
              da transação pelo sistema e pelo provedor de pagamento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              6. Documentos enviados
            </h2>
            <p className="mt-2">
              O usuário declara estar autorizado a enviar os documentos
              necessários ao atendimento e reconhece que arquivos incompletos,
              inválidos ou incorretos podem impactar prazo, análise e execução
              do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              7. Limites da plataforma
            </h2>
            <p className="mt-2">
              A plataforma atua como ambiente operacional e de atendimento,
              podendo haver dependência de análise humana, exigências
              documentais específicas e validações externas ligadas à natureza do
              serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">8. Comunicação</h2>
            <p className="mt-2">
              As orientações e atualizações do atendimento podem ser prestadas
              pela plataforma, pela área do cliente e pelos canais oficiais de
              suporte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              9. Ausência de garantia de resultado
            </h2>
            <p className="mt-2">
              A DesenrolaGov não garante aprovação, deferimento, prazo de
              conclusão ou decisão de órgãos públicos. A atuação consiste em
              orientação, organização e acompanhamento do atendimento contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">10. Aceite</h2>
            <p className="mt-2">
              O uso da plataforma, o cadastro e a criação do pedido dependem do
              aceite expresso destes Termos de Uso e da Política de Privacidade.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}