import { getLegalVersionLabel } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          Documento institucional
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Política de Privacidade
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Versão vigente: {getLegalVersionLabel()}
        </p>

        <div className="prose prose-slate mt-8 max-w-none">
          <h2>1. Finalidade</h2>
          <p>
            Esta Política de Privacidade explica como os dados pessoais são
            coletados, utilizados, armazenados e protegidos no uso da plataforma
            DesenrolaGov.
          </p>

          <h2>2. Dados coletados</h2>
          <p>
            Podemos coletar dados de identificação, contato, dados do pedido,
            documentos enviados pelo usuário e informações necessárias para a
            prestação do serviço contratado.
          </p>

          <h2>3. Uso das informações</h2>
          <p>
            Os dados são utilizados para cadastro, autenticação, criação de
            pedidos, análise documental, execução do serviço contratado,
            comunicação com o cliente e cumprimento de obrigações legais e
            operacionais.
          </p>

          <h2>4. Compartilhamento</h2>
          <p>
            Os dados não são comercializados. O compartilhamento pode ocorrer
            apenas quando necessário para processamento de pagamentos, hospedagem,
            segurança da plataforma, cumprimento legal ou execução do serviço.
          </p>

          <h2>5. Armazenamento e segurança</h2>
          <p>
            Adotamos medidas técnicas e administrativas razoáveis para reduzir
            riscos de acesso não autorizado, alteração indevida, perda ou
            vazamento de informações.
          </p>

          <h2>6. Direitos do titular</h2>
          <p>
            O usuário poderá solicitar atualização, correção ou revisão de
            informações pessoais, observado o que for aplicável à operação e à
            legislação vigente.
          </p>

          <h2>7. Retenção</h2>
          <p>
            Os dados poderão ser mantidos pelo período necessário para execução
            do serviço, cumprimento de obrigações legais, prevenção a fraudes,
            segurança da plataforma e resguardo operacional.
          </p>

          <h2>8. Contato</h2>
          <p>
            Solicitações relacionadas à privacidade e tratamento de dados poderão
            ser encaminhadas pelos canais oficiais de suporte da plataforma.
          </p>
        </div>
      </div>
    </main>
  );
}