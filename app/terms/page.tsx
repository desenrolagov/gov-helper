import { getLegalVersionLabel } from "@/lib/legal";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-blue-600">Documento institucional</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Versão vigente: {getLegalVersionLabel()}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Objeto
            </h2>
            <p className="mt-2">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma
              DesenrolaGov, incluindo cadastro, contratação de serviços,
              acompanhamento de pedidos, envio de documentos e entrega de
              resultados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              2. Responsabilidade do usuário
            </h2>
            <p className="mt-2">
              O usuário se compromete a fornecer informações verdadeiras,
              manter seus dados atualizados e enviar documentos válidos e
              legíveis quando solicitados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Fluxo do serviço
            </h2>
            <p className="mt-2">
              A contratação segue o fluxo operacional da plataforma, incluindo
              criação do pedido, pagamento, envio de documentos, análise e
              conclusão conforme o tipo de serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Pagamentos
            </h2>
            <p className="mt-2">
              Os pagamentos podem ser processados por parceiros de pagamento. A
              confirmação do pedido e a evolução do fluxo dependem da validação
              da transação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5. Documentos enviados
            </h2>
            <p className="mt-2">
              O usuário declara estar autorizado a enviar os documentos
              necessários ao atendimento e reconhece que arquivos incompletos,
              inválidos ou incorretos podem impactar o prazo e a execução do
              serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              6. Limites da plataforma
            </h2>
            <p className="mt-2">
              A plataforma atua como ambiente operacional e de atendimento,
              podendo haver dependência de análise humana, validações externas e
              exigências documentais específicas do serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              7. Aceite
            </h2>
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