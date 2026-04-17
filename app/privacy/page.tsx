import { getLegalVersionLabel } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-blue-600">Documento institucional</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Versão vigente: {getLegalVersionLabel()}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Finalidade
            </h2>
            <p className="mt-2">
              Esta Política de Privacidade explica como os dados pessoais são
              coletados, utilizados, armazenados e protegidos no uso da
              plataforma DesenrolaGov.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              2. Dados coletados
            </h2>
            <p className="mt-2">
              Podemos coletar dados de identificação, contato, dados do pedido,
              documentos enviados pelo usuário e informações necessárias para a
              prestação do serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Uso das informações
            </h2>
            <p className="mt-2">
              Os dados são utilizados para cadastro, autenticação, criação de
              pedidos, análise documental, execução do serviço contratado,
              comunicação com o cliente e cumprimento de obrigações legais e
              operacionais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Compartilhamento
            </h2>
            <p className="mt-2">
              Os dados não são comercializados. O compartilhamento pode ocorrer
              apenas quando necessário para processamento de pagamentos,
              hospedagem, segurança da plataforma, cumprimento legal ou execução
              do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5. Armazenamento e segurança
            </h2>
            <p className="mt-2">
              Adotamos medidas técnicas e administrativas razoáveis para reduzir
              riscos de acesso não autorizado, alteração indevida, perda ou
              vazamento de informações.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              6. Direitos do titular
            </h2>
            <p className="mt-2">
              O usuário poderá solicitar atualização, correção ou revisão de
              informações pessoais, observado o que for aplicável à operação e à
              legislação vigente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              7. Contato
            </h2>
            <p className="mt-2">
              Solicitações relacionadas à privacidade e tratamento de dados
              poderão ser encaminhadas pelos canais oficiais de suporte da
              plataforma.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}