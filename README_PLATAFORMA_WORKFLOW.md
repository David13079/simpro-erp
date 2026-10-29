# 🚀 Plataforma de Gestão de Demandas ERP Sênior — Simpro do Brasil

Este documento detalha o funcionamento, links de rede local, fluxo de e-mails automatizados e governança da plataforma de demandas do ERP Sênior com atendimento direcionado ao consultor **Darlan**.

---

## 🌐 1. Links Oficiais Permanentes (Nuvem 24/7 — Computador, Celular e Qualquer Rede)

A plataforma está publicada de forma definitiva no **GitHub Pages** integrada em tempo real ao **Google Apps Script (Planilha Google + Disparo de E-mails Automático)**, funcionando 24 horas por dia mesmo com o computador desligado:

| Recurso | Endereço Oficial Permanente (Nuvem 24/7) | Finalidade |
| :--- | :--- | :--- |
| **Portal de Solicitações (Geral da Empresa)** | [https://david13079.github.io/simpro-erp/solicitar.html](https://david13079.github.io/simpro-erp/solicitar.html) | Formulário simplificado e direto para qualquer colaborador abrir demandas para o **Darlan**. |
| **Guia de Treinamento Interativo** | [https://david13079.github.io/simpro-erp/treinamento.html](https://david13079.github.io/simpro-erp/treinamento.html) | Apresentação em 7 slides ensinando a equipe a operar o fluxo Kanban e cadastrar demandas. |
| **Painel Digital Kanban & Gestão** | [https://david13079.github.io/simpro-erp/](https://david13079.github.io/simpro-erp/) | Gestão de cartões por arrasto (Drag & Drop), Fila Gerencial, Modo Slides e Indicadores. |
| **Apresentação em Slides (16:9)** | [https://david13079.github.io/simpro-erp/?tab=slides](https://david13079.github.io/simpro-erp/?tab=slides) | Projeção em tela cheia para comitês, alinhamentos semanais e TVs industriais. |

---

## 📬 2. Fluxo Automatizado de E-mails (Workflows & Relatórios)

A plataforma possui um mecanismo completo de geração e disparo de e-mails com identidade visual da **Simpro do Brasil** e cores da **Sênior Sistemas** (`#00A859`):

### A. E-mail de Workflow em Tempo Real (Nova Demanda Criada)
Toda vez que uma nova demanda é aberta (seja pelo portal público `/solicitar.html` ou pelo painel), um e-mail formatado é enviado para:
1. `ewerton.consultoria@gmail.com`
2. `angelin.miranda@simprodobrasil.com.br`
3. `backupvilax@gmail.com`

**Conteúdo do e-mail:**
- **Assunto:** `[SIMPRO ERP - Nova Solicitação para Darlan] {Título da Ação} ({Área}) - Solicitante: {Nome}`
- **Card Executivo:** Solicitante, Departamento, Criticidade colorida, Data de abertura e Prazo desejado.
- **Consultor Responsável:** **Darlan**
- **Diagnóstico & Impacto:** O que está acontecendo no ERP.
- **Escopo Solicitado:** O que precisa ser feito pelo consultor.
- **Botão Direto:** `[📊 Acessar Painel Kanban & Gerenciar Demanda]` apontando para `http://192.168.2.178:3050`.

---

### B. Relatório Mensal Compilado de Indicadores (Fechamento de Mês)
No fim de cada mês, um resumo executivo com todos os indicadores consolidados é enviado para:
1. `douglas.araujo@simprodobrasil.com.br`
2. `federigo.daub@simprodobrasil.com.br`

**Conteúdo do Relatório:**
- **Assunto:** `[SIMPRO ERP] Relatório Mensal de Indicadores e Demandas ERP Sênior - {Mês/Ano}`
- **Quatro KPIs Chave:**
  * 📈 **Total de Demandas Registradas no Mês**
  * ⏳ **Demandas no Backlog (Não iniciado)**
  * ⚙️ **Demandas em Atendimento (Em andamento pelo Darlan)**
  * ✅ **Demandas Concluídas (Feito)** e **Taxa de Conclusão (%)**
- **Distribuição por Criticidade:** Quantidade de ações Críticas, Altas, Médias e Baixas.
- **Distribuição por Departamento:** Volume demandado por cada área da fábrica e administrativo.
- **Relação de Ações do Período:** Tabela com todas as ações, solicitantes, áreas e seus respectivos status vigentes.

#### Como Funciona o Disparo:
1. **Automático (Rotina de Servidor):** O servidor checa a cada 30 minutos. Se for o último dia do mês às 18:00 (ou depois), compila os indicadores e dispara o e-mail aos destinatários.
2. **Manual sob Demanda (1 Clique no Painel):** Na aba **Indicadores** do painel principal, há o botão:
   - `[👁️ Prévia do E-mail]`: Abre o modal exibindo exatamente o layout que será enviado.
   - `[🚀 Disparar Relatório Mensal Agora]`: Dispara o e-mail imediatamente para Douglas e Federigo a qualquer momento.
