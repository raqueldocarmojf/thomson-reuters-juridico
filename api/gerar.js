export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { url, conteudo, persona, canal, objetivo, contexto } = req.body;

  if (!persona) return res.status(400).json({ error: "Persona é obrigatória." });
  if (!url && !conteudo) return res.status(400).json({ error: "Informe o link do site ou cole o conteúdo manualmente." });

  let conteudoFinal = conteudo || "";

  if (url && url.startsWith("http")) {
    try {
      const siteRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" },
        signal: AbortSignal.timeout(8000)
      });
      const html = await siteRes.text();
      const semTags = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 6000);
      conteudoFinal = semTags + (conteudo ? "\n\nContexto adicional do SDR:\n" + conteudo : "");
    } catch (e) {
      if (!conteudo) return res.status(400).json({ error: "Nao foi possivel acessar o site. Cole o conteudo manualmente." });
    }
  }

  const CATALOGO = `
1. Legal One (Escritorios de Advocacia): sistema de gestao juridica em nuvem para contencioso e consultivo. Substitui CP-Pro. Ideal para escritorios de qualquer porte que querem modernizar a operacao.
2. Legal One (Departamentos Juridicos): centraliza processos, atividades e compliance. Ideal para empresas com departamento juridico interno.
3. Legal One Analytics: BI integrado ao Legal One com indicadores estrategicos. Ideal para quem precisa de visibilidade gerencial.
4. Workflow Smart: automacoes padronizadas dentro do Legal One. Ideal para escritorios que querem reduzir erros operacionais.
5. HighQ (Escritorios): gestao consultiva, documentos, contratos, arbitragens, M&A. Ideal para escritorios com foco consultivo.
6. HighQ (Departamentos): colaboracao, contratos e gestao de riscos juridicos. Ideal para departamentos com alto volume contratual.
7. CoCounsel Core: assistente de IA juridica para pesquisa, analise e elaboracao de pecas. Ideal para advogados que querem produtividade com IA confiavel.
8. Checkpoint: conteudo fiscal, tributario e trabalhista. Ideal para tributaristas e departamentos fiscais.
9. RTO, Revista dos Tribunais Online: doutrina, jurisprudencia e legislacao atualizada. Ideal para pesquisa juridica aprofundada.
10. ProView, Biblioteca Digital: obras especializadas com curadoria da Editora RT. Ideal para referencias bibliograficas.
11. Legal One Academic: simulacao de rotina juridica para sala de aula. Ideal para faculdades de Direito.
12. RT Prime: assinatura de conteudos exclusivos da Revista dos Tribunais. Ideal para profissionais e estudantes.`;

  const CASES = `
- Escritorio de advocacia de medio porte: migrou do CP-Pro (descontinuado) para o Legal One. Resultado: gestao completa do contencioso em nuvem, reducao de erros por prazo perdido e visibilidade total das atividades do time.
- Departamento juridico de multinacional: implantou Legal One e Legal One Analytics. Resultado: centralizacao de todos os processos e dashboards executivos para tomada de decisao estrategica da diretoria juridica.
- Escritorio com foco em M&A e contratos: adotou o HighQ. Resultado: gestao de documentos, contratos e operacoes de arbitragem em um unico ambiente colaborativo, eliminando troca de arquivos por e-mail.
- Escritorio tributarista: assinou o Checkpoint. Resultado: seguranca juridica nas analises fiscais com fontes oficiais atualizadas, especialmente relevante durante a Reforma Tributaria.`;

  const prompt = `Voce e um especialista em prospeccao B2B outbound do time comercial da Thomson Reuters Brasil, divisao juridica. Voce escreve mensagens diretas, personalizadas e consultivas, nunca genericas.

PORTFOLIO:
${CATALOGO}

CASES DE SUCESSO DA THOMSON REUTERS:
${CASES}

CONTEXTO DA ABORDAGEM:
- Conteudo do prospect: ${conteudoFinal}
- Persona alvo (cargo e contexto): ${persona}
- Canal: ${canal}
- Objetivo: ${objetivo}
${contexto ? `- Contexto adicional: ${contexto}` : ""}

FRAMEWORK RAIZ - siga essa estrutura rigorosamente na mensagem:
R (Relevancia Real): abra com uma observacao especifica e verificavel sobre o prospect, uma vaga aberta, expansao do escritorio, area de atuacao identificada no site, porte do time juridico. NUNCA elogio generico.
A (Abertura Contextual): conecte o que foi observado com uma dor de mercado conhecida nesse contexto. Ex: escritorios em expansao costumam perder prazos por falta de centralizacao, ou departamentos juridicos de empresas sofrem com falta de visibilidade gerencial. Mostre que voce entende o padrao do mercado juridico.
I (Insight): traga o case da Thomson Reuters mais similar ao perfil do prospect. Use dados concretos e situacoes reais.
Z (Zona de Convite): feche com uma pergunta leve e de baixo compromisso. Ex: Faz sentido trocarmos uma ideia sobre isso em 15 min? ou Como voces estao gerenciando hoje o contencioso do escritorio? NUNCA vamos marcar uma reuniao.

REGRAS DE TOM E ESTILO:
- Use o primeiro nome da persona no inicio e ao longo da mensagem
- Seja direto e objetivo, sem rodeios
- Tom consultivo e premium, nao de vendedor
- Adapte o vocabulario ao cargo: Socio fala em rentabilidade e posicionamento. Diretor Juridico fala em controle e compliance. Gerente fala em processo e time. Professor e coordenador falam em formacao e experiencia pratica
- LinkedIn: curto, direto, paragrafos de 1 a 2 linhas
- Email: um pouco mais longo, contextual, feche com Abracos e nome do SDR
- WhatsApp: muito curto, informal, uma pergunta no final
- Ligacao: roteiro com abertura, contexto e pergunta de diagnostico
- NUNCA mencione o nome da solucao de forma comercial, fale em resultado e dor resolvida

Identifique qual solucao tem maior fit e gere a abordagem seguindo rigorosamente o RAIZ.

Responda SOMENTE em JSON valido, sem markdown nem texto fora do JSON:
{"produto_indicado":"nome exato de uma das 12 solucoes","fit_score":85,"justificativa_fit":"2-3 frases sobre o fit usando dados reais do prospect e do case mais parecido","sinais_de_compra":["sinal 1 observado no prospect","sinal 2","sinal 3"],"abordagem":"mensagem completa seguindo o framework RAIZ no tom e formato do canal escolhido assinada como time comercial Thomson Reuters","dicas_de_follow_up":["dica pratica 1 baseada no contexto real","dica pratica 2"]}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        messages: [
          { role: "system", content: "Especialista em prospeccao B2B juridica. Responda sempre em JSON valido." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err?.error?.message || "Erro na API" });
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erro interno" });
  }
}
