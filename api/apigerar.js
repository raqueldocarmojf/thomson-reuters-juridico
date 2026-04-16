export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { url, conteudo, persona, canal, objetivo, tipo, contexto, email } = req.body;

  if (!persona) return res.status(400).json({ error: "Persona é obrigatória." });
  if (!url && !conteudo) return res.status(400).json({ error: "Informe o link do site ou cole o conteúdo manualmente." });

  const EMAILS_AUTORIZADOS = (process.env.EMAILS_AUTORIZADOS || "").split(",").map(e => e.trim().toLowerCase());
  const emailUsuario = (email || "").trim().toLowerCase();

  if (!emailUsuario) return res.status(401).json({ error: "E-mail obrigatório para acessar a ferramenta." });
  if (EMAILS_AUTORIZADOS.length > 0 && !EMAILS_AUTORIZADOS.includes(emailUsuario)) {
    return res.status(403).json({ error: "Acesso não autorizado. Entre em contato com seu gestor para liberar o acesso." });
  }

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
      if (!conteudo) return res.status(400).json({ error: "Não foi possível acessar o site. Cole o conteúdo manualmente." });
    }
  }

  const CATALOGO = `
1. Legal One (Escritórios): gestão jurídica em nuvem para contencioso e consultivo. Substitui CP-Pro. Ideal para escritórios que querem modernizar a operação.
2. Legal One (Departamentos Jurídicos): centraliza processos, atividades e compliance. Ideal para empresas com departamento jurídico interno.
3. Legal One Analytics: BI integrado ao Legal One com indicadores estratégicos. Ideal para quem precisa de visibilidade gerencial.
4. Workflow Smart: automações padronizadas dentro do Legal One. Ideal para escritórios que querem reduzir erros operacionais.
5. HighQ (Escritórios): gestão consultiva — documentos, contratos, arbitragens, M&A. Ideal para escritórios com foco consultivo.
6. HighQ (Departamentos): colaboração, contratos e gestão de riscos jurídicos. Ideal para departamentos com alto volume contratual.
7. CoCounsel Core: assistente de IA jurídica para pesquisa, análise e elaboração de peças. Ideal para advogados que querem produtividade com IA confiável.
8. Checkpoint: conteúdo fiscal, tributário e trabalhista. Ideal para tributaristas e departamentos fiscais.
9. RTO — Revista dos Tribunais Online: doutrina, jurisprudência e legislação atualizada. Ideal para pesquisa jurídica aprofundada.
10. ProView — Biblioteca Digital: obras especializadas com curadoria da Editora RT. Ideal para referências bibliográficas.
11. Legal One Academic: simulação de rotina jurídica para sala de aula. Ideal para faculdades de Direito.
12. RT Prime: assinatura de conteúdos exclusivos da Revista dos Tribunais. Ideal para profissionais e estudantes.`;

  const prompt = `Você é especialista em prospecção B2B outbound do time comercial da Thomson Reuters Brasil, divisão jurídica.

PORTFÓLIO:
${CATALOGO}

CONTEXTO:
- Conteúdo do prospect: ${conteudoFinal}
- Persona: ${persona}
- Canal: ${canal}
- Objetivo: ${objetivo}
${contexto ? `- Contexto adicional: ${contexto}` : ""}

Identifique a solução com maior fit e gere abordagem consultiva e premium com referências reais do prospect. Assine como time comercial Thomson Reuters.

Responda SOMENTE em JSON válido:
{"produto_indicado":"nome exato","fit_score":85,"justificativa_fit":"2-3 frases com dados reais do prospect","sinais_de_compra":["sinal 1","sinal 2","sinal 3"],"abordagem":"mensagem completa personalizada com detalhes reais do prospect","dicas_de_follow_up":["dica 1","dica 2"]}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          { role: "system", content: "Especialista em prospecção B2B jurídica. Responda sempre em JSON válido." },
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
