import { getLegalVersionLabel } from "@/lib/legal";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">

        <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
          Documento institucional
        </div>

        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
          Política de Privacidade
        </h1>

        <p className="mt-2 text-sm text-white/70">
          Versão vigente: {getLegalVersionLabel()}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-white/80">

          <section>
            <h2 className="text-lg font-bold text-white">1. Finalidade</h2>
            <p className="mt-2">
              Esta Política de Privacidade explica como os dados pessoais são
              coletados, utilizados, armazenados e protegidos no uso da
              plataforma DesenrolaGov.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">2. Dados coletados</h2>
            <p className="mt-2">
              Podemos coletar dados de identificação, contato, dados do pedido,
              documentos enviados pelo usuário e informações necessárias para a
              prestação do serviço contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">3. Uso das informações</h2>
            <p className="mt-2">
              Os dados são utilizados para cadastro, autenticação, criação de
              pedidos, análise documental, execução do serviço contratado,
              comunicação com o cliente e cumprimento de obrigações legais e
              operacionais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">4. Compartilhamento</h2>
            <p className="mt-2">
              Os dados não são comercializados. O compartilhamento pode ocorrer
              apenas quando necessário para processamento de pagamentos,
              hospedagem, segurança da plataforma, cumprimento legal ou execução
              do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">5. Armazenamento e segurança</h2>
            <p className="mt-2">
              Adotamos medidas técnicas e administrativas razoáveis para reduzir
              riscos de acesso não autorizado, alteração indevida, perda ou
              vazamento de informações.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">6. Direitos do titular</h2>
            <p className="mt-2">
              O usuário poderá solicitar atualização, correção ou revisão de
              informações pessoais, conforme a legislação vigente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">7. Retenção</h2>
            <p className="mt-2">
              Os dados poderão ser mantidos pelo período necessário para execução
              do serviço, cumprimento de obrigações legais, prevenção a fraudes e
              segurança da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">8. Contato</h2>
            <p className="mt-2">
              Solicitações relacionadas à privacidade poderão ser feitas pelos
              canais oficiais de suporte da DesenrolaGov.
            </p>
          </section>

        </div>

        <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
          A DesenrolaGov é uma assessoria privada e não possui vínculo com
          órgãos públicos.
        </div>

      </div>
    </main>
  );
}