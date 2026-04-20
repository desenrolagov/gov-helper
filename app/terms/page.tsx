import { getLegalVersionLabel } from "@/lib/legal";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          Documento institucional
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Termos de Uso
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Versão vigente: {getLegalVersionLabel()}
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Atenção:</strong> a DesenrolaGov atua como assessoria privada
          e não possui vínculo com órgãos públicos.
        </div>

        <div className="prose prose-slate mt-8 max-w-none">
          <h2>1. Objeto</h2>
          <p>
            Estes Termos de Uso regulam o acesso e a utilização da plataforma
            DesenrolaGov, incluindo cadastro, contratação de serviços,
            acompanhamento de pedidos, envio de documentos e entrega de
            resultados.
          </p>

          <h2>2. Natureza da atividade</h2>
          <p>
            A DesenrolaGov presta assessoria privada de apoio operacional,
            orientação e organização do fluxo de atendimento. A plataforma não
            representa órgão público, autarquia, repartição oficial ou canal
            governamental.
          </p>

          <h2>3. Responsabilidade do usuário</h2>
          <p>
            O usuário se compromete a fornecer informações verdadeiras, manter
            seus dados atualizados e enviar documentos válidos, legíveis e
            compatíveis com o serviço contratado.
          </p>

          <h2>4. Fluxo do serviço</h2>
          <p>
            A contratação segue o fluxo operacional da plataforma, incluindo
            criação do pedido, pagamento, envio de documentos, análise e
            conclusão conforme o tipo de serviço contratado.
          </p>

          <h2>5. Pagamentos</h2>
          <p>
            Os pagamentos podem ser processados por parceiros especializados. A
            confirmação do pedido e a evolução do fluxo dependem da validação da
            transação pelo sistema e pelo provedor de pagamento.
          </p>

          <h2>6. Documentos enviados</h2>
          <p>
            O usuário declara estar autorizado a enviar os documentos necessários
            ao atendimento e reconhece que arquivos incompletos, inválidos ou
            incorretos podem impactar prazo, análise e execução do serviço.
          </p>

          <h2>7. Limites da plataforma</h2>
          <p>
            A plataforma atua como ambiente operacional e de atendimento, podendo
            haver dependência de análise humana, exigências documentais
            específicas e validações externas ligadas à natureza do serviço.
          </p>

          <h2>8. Comunicação</h2>
          <p>
            As orientações e atualizações do atendimento podem ser prestadas pela
            plataforma, pela área do cliente e pelos canais oficiais de suporte.
          </p>

          <h2>9. Aceite</h2>
          <p>
            O uso da plataforma, o cadastro e a criação do pedido dependem do
            aceite expresso destes Termos de Uso e da Política de Privacidade.
          </p>
        </div>
      </div>
    </main>
  );
}