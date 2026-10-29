/* ==========================================================================
   PAINEL DE AÇÕES ERP SÊNIOR
   Lógica e Interatividade Frontend Minimalista
   ========================================================================== */

(function () {
  'use strict';

  // ESTADO GLOBAL
  const state = {
    acoes: [],
    currentSlideIndex: 0,
    currentView: 'view-kanban',
    draggedActionId: null,
    searchQuery: '',
    filterStatus: '',
    filterCriticidade: '',
    filterArea: '',
    theme: localStorage.getItem('senior_erp_theme') || 'theme-light'
  };

  // CONSTANTES
  const CRITICIDADE_PESOS = {
    'Crítica': 4,
    'Alta': 3,
    'Média': 2,
    'Baixa': 1
  };

  const STATUS_CLASSES = {
    'Não iniciado': 'status-pill-nao-iniciado',
    'Em andamento': 'status-pill-em-andamento',
    'Feito': 'status-pill-feito'
  };

  // ELEMENTOS DOM
  const dom = {
    body: document.body,
    tabBtns: document.querySelectorAll('.tab-btn'),
    viewSections: document.querySelectorAll('.view-section'),
    
    // KPI elements
    kpiTotal: document.getElementById('kpi-total-val'),
    kpiNaoIniciado: document.getElementById('kpi-nao-iniciado-val'),
    kpiEmAndamento: document.getElementById('kpi-em-andamento-val'),
    kpiFeito: document.getElementById('kpi-feito-val'),
    kpiTaxaConclusao: document.getElementById('kpi-taxa-conclusao'),
    kpiAtraso: document.getElementById('kpi-atraso-val'),
    kpiAtrasoDesc: document.getElementById('kpi-atraso-desc'),

    // Kanban columns
    cardsNaoIniciado: document.getElementById('cards-nao-iniciado'),
    cardsEmAndamento: document.getElementById('cards-em-andamento'),
    cardsFeito: document.getElementById('cards-feito'),
    counterNaoIniciado: document.getElementById('counter-nao-iniciado'),
    counterEmAndamento: document.getElementById('counter-em-andamento'),
    counterFeito: document.getElementById('counter-feito'),
    btnAddBacklogHeader: document.getElementById('btn-add-backlog-header'),
    btnInsertKanbanQuick: document.getElementById('btn-insert-kanban-quick'),

    // Slide Mode elements
    slideWrapper: document.getElementById('slide-wrapper'),
    slideFrame: document.getElementById('slide-frame-viewport'),
    slideCurrentCounter: document.getElementById('slide-current-counter'),
    btnSlidePrev: document.getElementById('btn-slide-prev'),
    btnSlideNext: document.getElementById('btn-slide-next'),
    btnSlideFullscreen: document.getElementById('btn-slide-fullscreen'),
    btnSlideEdit: document.getElementById('btn-slide-edit'),
    btnSlideNewDemand: document.getElementById('btn-slide-new-demand'),
    slideActionName: document.getElementById('slide-action-name'),
    slideStatusPill: document.getElementById('slide-status-pill'),
    slideSolicitante: document.getElementById('slide-solicitante'),
    slideArea: document.getElementById('slide-area'),
    slideCriticidade: document.getElementById('slide-criticidade'),
    slideDataInicio: document.getElementById('slide-data-inicio'),
    slideDataFim: document.getElementById('slide-data-fim'),
    slideProblemaText: document.getElementById('slide-problema-text'),
    slideOqueFazerText: document.getElementById('slide-oque-fazer-text'),
    slideTimingBadge: document.getElementById('slide-timing-badge'),

    // Queue elements
    queueTableBody: document.getElementById('queue-table-body'),
    queueSearchInput: document.getElementById('queue-search-input'),
    filterStatus: document.getElementById('filter-status'),
    filterCriticidade: document.getElementById('filter-criticidade'),
    filterArea: document.getElementById('filter-area'),
    btnInsertQueueTop: document.getElementById('btn-insert-queue-top'),

    // Direct Form Elements (Visão Inserir Demanda no Backlog)
    formDirectCreate: document.getElementById('form-direct-create'),
    directNome: document.getElementById('direct-nome'),
    directDataInicio: document.getElementById('direct-data-inicio'),
    directDataFim: document.getElementById('direct-data-fim'),
    directCriticidade: document.getElementById('direct-criticidade'),
    directArea: document.getElementById('direct-area'),
    directSolicitante: document.getElementById('direct-solicitante'),
    directProblema: document.getElementById('direct-problema'),
    directOqueFazer: document.getElementById('direct-oque-fazer'),

    // Modal Edit Action
    modalActionBackdrop: document.getElementById('modal-action-backdrop'),
    modalActionTitle: document.getElementById('modal-action-title'),
    btnOpenModalAction: document.getElementById('btn-open-modal-action'),
    btnCloseModalAction: document.getElementById('btn-close-modal-action'),
    btnCancelModalAction: document.getElementById('btn-cancel-modal-action'),
    formAction: document.getElementById('form-action'),
    actionId: document.getElementById('action-id'),
    actionNome: document.getElementById('action-nome'),
    actionDataInicio: document.getElementById('action-data-inicio'),
    actionDataFim: document.getElementById('action-data-fim'),
    actionStatus: document.getElementById('action-status'),
    actionCriticidade: document.getElementById('action-criticidade'),
    actionArea: document.getElementById('action-area'),
    actionSolicitante: document.getElementById('action-solicitante'),
    actionProblema: document.getElementById('action-problema'),
    actionOqueFazer: document.getElementById('action-oque-fazer'),

    // Other actions
    btnExportJson: document.getElementById('btn-export-json'),
    btnToggleTheme: document.getElementById('btn-toggle-theme'),
    toast: document.getElementById('toast-notification')
  };

  // INICIALIZAÇÃO
  async function init() {
    applyTheme(state.theme);
    bindEvents();
    await carregarAcoes();
    renderAll();
  }

  // APLICAÇÃO DE TEMA
  function applyTheme(theme) {
    state.theme = theme;
    dom.body.className = theme;
    localStorage.setItem('senior_erp_theme', theme);
  }

  // NOTIFICAÇÃO TOAST
  function showToast(msg, duration = 3000) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('toast-show');
    setTimeout(() => {
      dom.toast.classList.remove('toast-show');
    }, duration);
  }

  const GAS_ERP_URL = 'https://script.google.com/macros/s/AKfycbxDw8-NObFcdqhWD4JyW5mQKiED4UaUXcHTy_Ztwtjlb25vBGgiYnwuU7Fttte6pHZVtQ/exec?api=erp';

  // CARREGAR AÇÕES DA API NUVEM GAS (COM FALLBACK LOCAL)
  async function carregarAcoes() {
    try {
      const res = await fetch(GAS_ERP_URL + '&action=listar');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          state.acoes = json.data;
          localStorage.setItem('senior_erp_acoes', JSON.stringify(state.acoes));
          return;
        }
      }
      throw new Error('Falha ao consultar API Nuvem GAS');
    } catch (errCloud) {
      try {
        const resLocal = await fetch('/api/acoes');
        if (resLocal.ok) {
          const jsonLocal = await resLocal.json();
          state.acoes = jsonLocal.data || [];
          localStorage.setItem('senior_erp_acoes', JSON.stringify(state.acoes));
          return;
        }
      } catch (errLocal) {}
      console.warn('Backend indisponível, usando localStorage:', errCloud);
      const cached = localStorage.getItem('senior_erp_acoes');
      state.acoes = cached ? JSON.parse(cached) : [];
    }
  }

  // SALVAR AÇÃO (API NUVEM GAS + LOCAL + FALLBACK)
  async function salvarAcaoNoBackend(acao, isEdicao = false) {
    try {
      const res = await fetch(GAS_ERP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: isEdicao ? 'atualizar' : 'criar',
          id: acao.id,
          payload: acao
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Sincroniza opcionalmente com servidor local se ativo
          if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
            const urlLocal = isEdicao ? `/api/acoes/${acao.id}` : '/api/acoes';
            fetch(urlLocal, {
              method: isEdicao ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(acao)
            }).catch(() => {});
          }
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Erro ao sincronizar com backend nuvem:', e);
    }
    // Fallback local
    if (isEdicao) {
      const idx = state.acoes.findIndex(a => a.id === acao.id);
      if (idx !== -1) state.acoes[idx] = acao;
    } else {
      acao.id = 'acao_' + Date.now();
      state.acoes.push(acao);
    }
    localStorage.setItem('senior_erp_acoes', JSON.stringify(state.acoes));
    return acao;
  }

  // EXCLUIR AÇÃO
  async function excluirAcaoNoBackend(id) {
    try {
      await fetch(GAS_ERP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'excluir', id: id })
      });
      if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
        fetch(`/api/acoes/${id}`, { method: 'DELETE' }).catch(() => {});
      }
    } catch (e) {
      console.warn('Erro ao excluir no backend:', e);
    }
    state.acoes = state.acoes.filter(a => a.id !== id);
    localStorage.setItem('senior_erp_acoes', JSON.stringify(state.acoes));
  }

  // ATUALIZAR STATUS DE UMA AÇÃO (ARRASTO KANBAN)
  async function atualizarStatusAcao(id, novoStatus) {
    const acao = state.acoes.find(a => a.id === id);
    if (!acao || acao.status === novoStatus) return;
    acao.status = novoStatus;
    acao.atualizadoEm = new Date().toISOString();
    await salvarAcaoNoBackend(acao, true);
    renderAll();
    showToast(`Demanda movida para "${novoStatus}"`);
  }

  // RENDERIZAÇÃO COMPLETA
  function renderAll() {
    renderKPIs();
    renderKanban();
    renderSlide();
    renderQueue();
    renderAnalytics();
    popularFiltrosAreas();
  }

  // ========================================================================
  // RENDERIZAÇÃO: KPIS & RESUMO
  // ========================================================================
  function renderKPIs() {
    const total = state.acoes.length;
    const naoIniciadas = state.acoes.filter(a => a.status === 'Não iniciado').length;
    const emAndamento = state.acoes.filter(a => a.status === 'Em andamento').length;
    const feito = state.acoes.filter(a => a.status === 'Feito').length;

    const taxa = total > 0 ? Math.round((feito / total) * 100) : 0;

    const hoje = new Date().toISOString().split('T')[0];
    const atrasadas = state.acoes.filter(a => {
      return a.status !== 'Feito' && a.dataFim && a.dataFim < hoje;
    }).length;

    dom.kpiTotal.textContent = total;
    dom.kpiNaoIniciado.textContent = naoIniciadas;
    dom.kpiEmAndamento.textContent = emAndamento;
    dom.kpiFeito.textContent = feito;
    dom.kpiTaxaConclusao.textContent = `${taxa}% concluído`;
    dom.kpiAtraso.textContent = atrasadas;
    dom.kpiAtrasoDesc.textContent = atrasadas === 0 ? 'em dia' : (atrasadas === 1 ? '1 demanda em atraso' : `${atrasadas} em atraso`);
  }

  // ========================================================================
  // RENDERIZAÇÃO: KANBAN BOARD (REGRAS ESTRITAS DE BACKLOG)
  // ========================================================================
  function renderKanban() {
    dom.cardsNaoIniciado.innerHTML = '';
    dom.cardsEmAndamento.innerHTML = '';
    dom.cardsFeito.innerHTML = '';

    const naoIniciadas = state.acoes.filter(a => a.status === 'Não iniciado');
    const emAndamento = state.acoes.filter(a => a.status === 'Em andamento');
    const feitas = state.acoes.filter(a => a.status === 'Feito');

    dom.counterNaoIniciado.textContent = naoIniciadas.length;
    dom.counterEmAndamento.textContent = emAndamento.length;
    dom.counterFeito.textContent = feitas.length;

    // Coluna 1: Não iniciado (Backlog - permite inserção)
    if (naoIniciadas.length === 0) {
      dom.cardsNaoIniciado.innerHTML = `
        <div style="text-align: center; padding: 2.2rem 1rem; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); display: flex; flex-direction: column; align-items: center; gap: 0.6rem;">
          <span>Nenhuma demanda no Backlog</span>
          <button class="btn btn-outline" style="font-size: 0.75rem;" id="btn-empty-backlog-add">
            ➕ Inserir Demanda no Backlog
          </button>
        </div>
      `;
      const btn = document.getElementById('btn-empty-backlog-add');
      if (btn) btn.addEventListener('click', () => abrirInserirDemandaDireta());
    } else {
      naoIniciadas.forEach(acao => dom.cardsNaoIniciado.appendChild(criarCardKanban(acao)));
    }

    // Coluna 2: Em andamento (WIP - sem criação, apenas arrasto)
    if (emAndamento.length === 0) {
      dom.cardsEmAndamento.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm);">
          Nenhuma demanda em execução<br>
          <small style="opacity: 0.75; display: inline-block; margin-top: 0.35rem;">(Arraste cards do Backlog para cá ao iniciar)</small>
        </div>
      `;
    } else {
      emAndamento.forEach(acao => dom.cardsEmAndamento.appendChild(criarCardKanban(acao)));
    }

    // Coluna 3: Feito (Concluído - sem criação, apenas arrasto)
    if (feitas.length === 0) {
      dom.cardsFeito.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm);">
          Nenhuma demanda concluída<br>
          <small style="opacity: 0.75; display: inline-block; margin-top: 0.35rem;">(Arraste para cá após a entrega do consultor)</small>
        </div>
      `;
    } else {
      feitas.forEach(acao => dom.cardsFeito.appendChild(criarCardKanban(acao)));
    }
  }

  function criarCardKanban(acao) {
    const card = document.createElement('div');
    card.className = 'action-card';
    card.draggable = true;
    card.dataset.id = acao.id;

    const critClass = `badge-crit-${(acao.criticidade || 'media').toLowerCase().replace('é', 'e').replace('í', 'i')}`;

    const hoje = new Date().toISOString().split('T')[0];
    const isAtrasado = acao.status !== 'Feito' && acao.dataFim && acao.dataFim < hoje;
    const dataFimFormatada = formatarDataBR(acao.dataFim);

    card.innerHTML = `
      <div class="card-top-row">
        <div class="badge-group">
          <span class="badge ${critClass}">${escapeHtml(acao.criticidade || 'Média')}</span>
          <span class="badge badge-dept">${escapeHtml(acao.area || 'Geral')}</span>
        </div>
        <span style="font-size: 0.7rem; color: var(--text-muted);">👤 ${escapeHtml(acao.solicitante || '-')}</span>
      </div>

      <div class="card-title">${escapeHtml(acao.nome)}</div>

      ${acao.problema ? `<div class="card-problem-snippet">${escapeHtml(acao.problema)}</div>` : ''}

      <div class="card-meta-row">
        <div class="card-dates ${isAtrasado ? 'date-late' : ''}">
          <span>🏁 Prazo: ${dataFimFormatada || 'Sem prazo'}</span>
          ${isAtrasado ? '<span title="Prazo vencido!">⚠️</span>' : ''}
        </div>
      </div>

      <div class="card-actions-bar">
        <button class="btn-card-slide" data-action="view-slide" data-id="${acao.id}" title="Abrir Modo Slide">
          <span>🖥️</span> Ver Slide
        </button>
        <div style="display: flex; gap: 0.3rem;">
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" data-action="edit" data-id="${acao.id}" title="Editar Demanda">
            ✏️
          </button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem; color: #dc2626;" data-action="delete" data-id="${acao.id}" title="Excluir">
            🗑️
          </button>
        </div>
      </div>
    `;

    // Drag and drop events
    card.addEventListener('dragstart', (e) => {
      state.draggedActionId = acao.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', acao.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      state.draggedActionId = null;
    });

    // Card buttons
    card.querySelector('[data-action="view-slide"]').addEventListener('click', () => {
      const idx = state.acoes.findIndex(a => a.id === acao.id);
      if (idx !== -1) {
        state.currentSlideIndex = idx;
        mudarVisao('view-slides');
      }
    });

    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      abrirModalEdicao(acao);
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (confirm(`Deseja realmente excluir a demanda:\n"${acao.nome}"?`)) {
        await excluirAcaoNoBackend(acao.id);
        renderAll();
        showToast('Demanda excluída.');
      }
    });

    return card;
  }

  // ========================================================================
  // RENDERIZAÇÃO: MODO APRESENTAÇÃO / SLIDE FRAME MINIMALISTA
  // ========================================================================
  function renderSlide() {
    const total = state.acoes.length;

    if (total === 0) {
      dom.slideCurrentCounter.textContent = 'Slide 0 de 0';
      dom.slideActionName.textContent = 'Nenhuma demanda cadastrada';
      dom.slideStatusPill.className = 'slide-header-status-badge status-pill-nao-iniciado';
      dom.slideStatusPill.textContent = '● Sem ações';
      dom.slideSolicitante.textContent = '-';
      dom.slideArea.textContent = '-';
      dom.slideCriticidade.textContent = '-';
      dom.slideDataInicio.textContent = '-';
      dom.slideDataFim.textContent = '-';
      dom.slideProblemaText.textContent = 'Para preencher o slide, clique em "+ Inserir Demanda" na barra superior para adicionar a primeira demanda real.';
      dom.slideOqueFazerText.textContent = 'O modelo de frame padronizado exibirá aqui o escopo e os entregáveis a serem executados pelo consultor ERP Sênior.';
      dom.slideTimingBadge.textContent = 'Status: Aguardando demandas';
      dom.btnSlidePrev.disabled = true;
      dom.btnSlideNext.disabled = true;
      dom.btnSlideEdit.disabled = true;
      return;
    }

    if (state.currentSlideIndex >= total) state.currentSlideIndex = total - 1;
    if (state.currentSlideIndex < 0) state.currentSlideIndex = 0;

    const acao = state.acoes[state.currentSlideIndex];
    dom.slideCurrentCounter.textContent = `Slide ${state.currentSlideIndex + 1} de ${total}`;

    dom.slideActionName.textContent = acao.nome;
    
    // Status Pill
    const pillClass = STATUS_CLASSES[acao.status] || 'status-pill-nao-iniciado';
    dom.slideStatusPill.className = `slide-header-status-badge ${pillClass}`;
    dom.slideStatusPill.textContent = `● ${acao.status}`;

    // Metadados do Frame
    dom.slideSolicitante.textContent = acao.solicitante || 'Não informado';
    dom.slideArea.textContent = acao.area || 'Geral';
    dom.slideCriticidade.textContent = acao.criticidade || 'Média';
    dom.slideDataInicio.textContent = formatarDataBR(acao.dataInicio) || 'Não informada';
    dom.slideDataFim.textContent = formatarDataBR(acao.dataFim) || 'Não informada';

    // Conteúdo Estratégico
    dom.slideProblemaText.textContent = acao.problema || 'Nenhum detalhe informado sobre o problema.';
    dom.slideOqueFazerText.textContent = acao.oQueFazer || 'Nenhum detalhe informado sobre o que precisa ser feito.';

    // Timing Badge
    const hoje = new Date().toISOString().split('T')[0];
    if (acao.status === 'Feito') {
      dom.slideTimingBadge.textContent = 'Status: Ação Concluída';
      dom.slideTimingBadge.style.color = 'var(--senior-green)';
    } else if (acao.dataFim && acao.dataFim < hoje) {
      dom.slideTimingBadge.textContent = 'Status: ⚠️ PRAZO VENCIDO';
      dom.slideTimingBadge.style.color = 'var(--crit-critica)';
    } else if (acao.dataFim) {
      dom.slideTimingBadge.textContent = `Prazo Previsto: ${formatarDataBR(acao.dataFim)}`;
      dom.slideTimingBadge.style.color = 'var(--text-secondary)';
    } else {
      dom.slideTimingBadge.textContent = 'Status: Sem data fim estipulada';
      dom.slideTimingBadge.style.color = 'var(--text-muted)';
    }

    dom.btnSlidePrev.disabled = state.currentSlideIndex === 0;
    dom.btnSlideNext.disabled = state.currentSlideIndex === total - 1;
    dom.btnSlideEdit.disabled = false;
  }

  // ========================================================================
  // RENDERIZAÇÃO: FILA GERENCIAL (TABELA)
  // ========================================================================
  function renderQueue() {
    dom.queueTableBody.innerHTML = '';

    let lista = [...state.acoes];

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      lista = lista.filter(a => 
        (a.nome && a.nome.toLowerCase().includes(q)) ||
        (a.area && a.area.toLowerCase().includes(q)) ||
        (a.solicitante && a.solicitante.toLowerCase().includes(q)) ||
        (a.problema && a.problema.toLowerCase().includes(q))
      );
    }

    if (state.filterStatus) {
      lista = lista.filter(a => a.status === state.filterStatus);
    }

    if (state.filterCriticidade) {
      lista = lista.filter(a => a.criticidade === state.filterCriticidade);
    }

    if (state.filterArea) {
      lista = lista.filter(a => a.area === state.filterArea);
    }

    // Ordenação Inteligente
    lista.sort((a, b) => {
      const statusOrder = { 'Em andamento': 1, 'Não iniciado': 2, 'Feito': 3 };
      const diffStatus = (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
      if (diffStatus !== 0) return diffStatus;

      const pesoA = CRITICIDADE_PESOS[a.criticidade] || 0;
      const pesoB = CRITICIDADE_PESOS[b.criticidade] || 0;
      if (pesoB !== pesoA) return pesoB - pesoA;

      if (a.dataFim && b.dataFim) return a.dataFim.localeCompare(b.dataFim);
      return 0;
    });

    if (lista.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Nenhuma demanda encontrada. Clique em "+ Inserir Demanda" para adicionar ações reais.
        </td>
      `;
      dom.queueTableBody.appendChild(tr);
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];

    lista.forEach((acao, index) => {
      const tr = document.createElement('tr');
      const critClass = `badge-crit-${(acao.criticidade || 'media').toLowerCase().replace('é', 'e').replace('í', 'i')}`;
      
      const isAtrasado = acao.status !== 'Feito' && acao.dataFim && acao.dataFim < hoje;
      let situacaoHtml = '';
      if (acao.status === 'Feito') {
        situacaoHtml = '<span style="color: var(--senior-green); font-weight: 600;">✓ Concluído</span>';
      } else if (isAtrasado) {
        situacaoHtml = '<span style="color: var(--crit-critica); font-weight: 700;">⚠️ Atrasado</span>';
      } else if (acao.dataFim) {
        situacaoHtml = '<span style="color: var(--status-wip);">No prazo</span>';
      } else {
        situacaoHtml = '<span style="color: var(--text-muted);">Sem prazo</span>';
      }

      tr.innerHTML = `
        <td><span class="queue-pos-badge">#${index + 1}</span></td>
        <td style="font-weight: 600;">${escapeHtml(acao.nome)}</td>
        <td><span class="badge badge-dept">${escapeHtml(acao.area || 'Geral')}</span></td>
        <td>👤 ${escapeHtml(acao.solicitante || '-')}</td>
        <td><span class="badge ${critClass}">${escapeHtml(acao.criticidade || 'Média')}</span></td>
        <td><span class="badge" style="background: var(--bg-muted);">${escapeHtml(acao.status)}</span></td>
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${formatarDataBR(acao.dataInicio) || '-'}</td>
        <td style="font-family: var(--font-mono); font-size: 0.8rem; ${isAtrasado ? 'color: var(--crit-critica); font-weight: 700;' : ''}">${formatarDataBR(acao.dataFim) || '-'}</td>
        <td>${situacaoHtml}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" data-action="view-slide" data-id="${acao.id}" title="Ver no Slide">
            🖥️
          </button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem;" data-action="edit" data-id="${acao.id}" title="Editar">
            ✏️
          </button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.72rem; color: #dc2626;" data-action="delete" data-id="${acao.id}" title="Excluir">
            🗑️
          </button>
        </td>
      `;

      tr.querySelector('[data-action="view-slide"]').addEventListener('click', () => {
        const idx = state.acoes.findIndex(a => a.id === acao.id);
        if (idx !== -1) {
          state.currentSlideIndex = idx;
          mudarVisao('view-slides');
        }
      });

      tr.querySelector('[data-action="edit"]').addEventListener('click', () => {
        abrirModalEdicao(acao);
      });

      tr.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (confirm(`Deseja realmente excluir a demanda:\n"${acao.nome}"?`)) {
          await excluirAcaoNoBackend(acao.id);
          renderAll();
          showToast('Demanda excluída.');
        }
      });

      dom.queueTableBody.appendChild(tr);
    });
  }

  function popularFiltrosAreas() {
    const areas = [...new Set(state.acoes.map(a => a.area).filter(Boolean))].sort();
    const currentVal = dom.filterArea.value;
    dom.filterArea.innerHTML = '<option value="">Todas as Áreas</option>';
    areas.forEach(ar => {
      const opt = document.createElement('option');
      opt.value = ar;
      opt.textContent = ar;
      if (ar === currentVal) opt.selected = true;
      dom.filterArea.appendChild(opt);
    });
  }

  // ========================================================================
  // RENDERIZAÇÃO: INDICADORES & ANALYTICS (CANVAS NATIVO HTML5)
  // ========================================================================
  function renderAnalytics() {
    desenharGraficoStatus();
    desenharGraficoCriticidade();
    desenharGraficoArea();
    desenharGraficoPrazo();
  }

  function desenharGraficoStatus() {
    const canvas = document.getElementById('chart-status');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const naoIniciadas = state.acoes.filter(a => a.status === 'Não iniciado').length;
    const emAndamento = state.acoes.filter(a => a.status === 'Em andamento').length;
    const feito = state.acoes.filter(a => a.status === 'Feito').length;
    const total = state.acoes.length;

    if (total === 0) {
      desenharMensagemVazia(ctx, width, height, 'Sem demandas para exibir');
      return;
    }

    const dados = [
      { label: 'Não iniciado (Backlog)', val: naoIniciadas, cor: '#64748B' },
      { label: 'Em andamento', val: emAndamento, cor: '#0284C7' },
      { label: 'Feito (Concluído)', val: feito, cor: '#00A859' }
    ];

    desenharDonut(ctx, width / 2 - 60, height / 2, 70, 45, dados, total);
    desenharLegenda(ctx, width / 2 + 50, height / 2 - 35, dados, total);
  }

  function desenharGraficoCriticidade() {
    const canvas = document.getElementById('chart-criticidade');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (state.acoes.length === 0) {
      desenharMensagemVazia(ctx, width, height, 'Sem demandas registradas');
      return;
    }

    const counts = {
      'Crítica': state.acoes.filter(a => a.criticidade === 'Crítica').length,
      'Alta': state.acoes.filter(a => a.criticidade === 'Alta').length,
      'Média': state.acoes.filter(a => a.criticidade === 'Média').length,
      'Baixa': state.acoes.filter(a => a.criticidade === 'Baixa').length
    };

    const barras = [
      { label: 'Crítica', val: counts['Crítica'], cor: '#DC2626' },
      { label: 'Alta', val: counts['Alta'], cor: '#EA580C' },
      { label: 'Média', val: counts['Média'], cor: '#D97706' },
      { label: 'Baixa', val: counts['Baixa'], cor: '#0284C7' }
    ];

    desenharBarrasHorizontais(ctx, 30, 20, width - 60, height - 40, barras, state.acoes.length);
  }

  function desenharGraficoArea() {
    const canvas = document.getElementById('chart-area');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (state.acoes.length === 0) {
      desenharMensagemVazia(ctx, width, height, 'Sem dados de áreas');
      return;
    }

    const porArea = {};
    state.acoes.forEach(a => {
      const ar = a.area || 'Outros';
      porArea[ar] = (porArea[ar] || 0) + 1;
    });

    const cores = ['#00A859', '#0284C7', '#6366F1', '#D97706', '#059669', '#0D9488'];
    const barras = Object.entries(porArea)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, val], idx) => ({ label, val, cor: cores[idx % cores.length] }));

    desenharBarrasHorizontais(ctx, 30, 20, width - 60, height - 40, barras, state.acoes.length);
  }

  function desenharGraficoPrazo() {
    const canvas = document.getElementById('chart-prazo');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (state.acoes.length === 0) {
      desenharMensagemVazia(ctx, width, height, 'Sem dados de prazos');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const concluidas = state.acoes.filter(a => a.status === 'Feito').length;
    const atrasadas = state.acoes.filter(a => a.status !== 'Feito' && a.dataFim && a.dataFim < hoje).length;
    const noPrazo = state.acoes.filter(a => a.status !== 'Feito' && (!a.dataFim || a.dataFim >= hoje)).length;

    const dados = [
      { label: 'Concluídas', val: concluidas, cor: '#00A859' },
      { label: 'No Prazo / Em Dia', val: noPrazo, cor: '#0284C7' },
      { label: 'Atrasadas', val: atrasadas, cor: '#DC2626' }
    ];

    desenharDonut(ctx, width / 2 - 60, height / 2, 70, 45, dados, state.acoes.length);
    desenharLegenda(ctx, width / 2 + 50, height / 2 - 35, dados, state.acoes.length);
  }

  function desenharMensagemVazia(ctx, w, h, msg) {
    ctx.fillStyle = '#64748B';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, w / 2, h / 2);
  }

  function desenharDonut(ctx, cx, cy, raioExt, raioInt, dados, total) {
    let anguloAtual = -0.5 * Math.PI;

    dados.forEach(d => {
      if (d.val === 0) return;
      const fatia = (d.val / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, raioExt, anguloAtual, anguloAtual + fatia);
      ctx.arc(cx, cy, raioInt, anguloAtual + fatia, anguloAtual, true);
      ctx.closePath();
      ctx.fillStyle = d.cor;
      ctx.fill();
      anguloAtual += fatia;
    });

    ctx.fillStyle = state.theme === 'theme-dark' ? '#F8FAFC' : '#0F172A';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), cx, cy);
  }

  function desenharLegenda(ctx, x, y, dados, total) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    dados.forEach((d, i) => {
      const itemY = y + (i * 24);
      ctx.beginPath();
      ctx.arc(x, itemY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = d.cor;
      ctx.fill();

      const pct = total > 0 ? Math.round((d.val / total) * 100) : 0;
      ctx.fillStyle = state.theme === 'theme-dark' ? '#CBD5E1' : '#334155';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`${d.label}: ${d.val} (${pct}%)`, x + 12, itemY);
    });
  }

  function desenharBarrasHorizontais(ctx, x, y, w, h, itens, total) {
    const alturaBarra = 16;
    const espacamento = (h - (itens.length * alturaBarra)) / (itens.length + 1);

    itens.forEach((item, idx) => {
      const curY = y + espacamento + idx * (alturaBarra + espacamento);
      const pct = total > 0 ? item.val / total : 0;
      const larguraBarra = Math.max(6, (w - 140) * pct);

      ctx.fillStyle = state.theme === 'theme-dark' ? '#CBD5E1' : '#334155';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, x, curY + alturaBarra / 2);

      ctx.fillStyle = state.theme === 'theme-dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(x + 90, curY, w - 140, alturaBarra, 3);
      ctx.fill();

      ctx.fillStyle = item.cor;
      ctx.beginPath();
      ctx.roundRect(x + 90, curY, larguraBarra, alturaBarra, 3);
      ctx.fill();

      ctx.fillStyle = state.theme === 'theme-dark' ? '#F8FAFC' : '#0F172A';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.val}`, x + w, curY + alturaBarra / 2);
    });
  }

  // ========================================================================
  // NAVEGAÇÃO DE VISÕES
  // ========================================================================
  function mudarVisao(targetViewId) {
    state.currentView = targetViewId;
    dom.tabBtns.forEach(btn => {
      const match = btn.dataset.view === targetViewId;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    dom.viewSections.forEach(sec => {
      sec.classList.toggle('active-view', sec.id === targetViewId);
    });

    if (targetViewId === 'view-slides') {
      renderSlide();
    } else if (targetViewId === 'view-analytics') {
      renderAnalytics();
    } else if (targetViewId === 'view-create') {
      dom.directNome.focus();
    }
  }

  function abrirModalNovaDemanda() {
    dom.modalActionTitle.textContent = '➕ Inserir Nova Demanda no Backlog';
    dom.actionId.value = '';
    dom.actionNome.value = '';
    dom.actionDataInicio.value = new Date().toISOString().split('T')[0];
    dom.actionDataFim.value = '';
    dom.actionStatus.value = 'Não iniciado';
    dom.actionStatus.disabled = true; // Sempre Não iniciado (Backlog)
    dom.actionCriticidade.value = 'Média';
    dom.actionArea.value = '';
    dom.actionSolicitante.value = '';
    dom.actionProblema.value = '';
    dom.actionOqueFazer.value = '';
    const btnSave = document.getElementById('btn-save-action');
    if (btnSave) btnSave.textContent = '💾 Inserir no Backlog';
    dom.modalActionBackdrop.classList.add('modal-open');
    dom.actionNome.focus();
  }

  // ========================================================================
  // GESTÃO DO MODAL DE EDIÇÃO / CRIAÇÃO
  // ========================================================================
  function abrirModalEdicao(acao) {
    dom.modalActionTitle.textContent = '✏️ Editar Demanda ERP';
    dom.actionId.value = acao.id;
    dom.actionNome.value = acao.nome || '';
    dom.actionDataInicio.value = acao.dataInicio || '';
    dom.actionDataFim.value = acao.dataFim || '';
    dom.actionStatus.value = acao.status || 'Não iniciado';
    dom.actionStatus.disabled = false;
    dom.actionCriticidade.value = acao.criticidade || 'Média';
    dom.actionArea.value = acao.area || '';
    dom.actionSolicitante.value = acao.solicitante || '';
    dom.actionProblema.value = acao.problema || '';
    dom.actionOqueFazer.value = acao.oQueFazer || '';
    const btnSave = document.getElementById('btn-save-action');
    if (btnSave) btnSave.textContent = 'Salvar Alterações';
    dom.modalActionBackdrop.classList.add('modal-open');
    dom.actionNome.focus();
  }

  function fecharModalEdicao() {
    dom.modalActionBackdrop.classList.remove('modal-open');
    dom.actionStatus.disabled = false;
  }

  // ========================================================================
  // EVENTOS E LISTENERS
  // ========================================================================
  function bindEvents() {
    // Tabs de Navegação
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => mudarVisao(btn.dataset.view));
    });

    // Inserir demanda no Backlog direto de dentro do Kanban e do Slide
    if (dom.btnAddBacklogHeader) {
      dom.btnAddBacklogHeader.addEventListener('click', abrirModalNovaDemanda);
    }
    if (dom.btnInsertKanbanQuick) {
      dom.btnInsertKanbanQuick.addEventListener('click', abrirModalNovaDemanda);
    }
    if (dom.btnInsertQueueTop) {
      dom.btnInsertQueueTop.addEventListener('click', abrirModalNovaDemanda);
    }
    if (dom.btnSlideNewDemand) {
      dom.btnSlideNewDemand.addEventListener('click', abrirModalNovaDemanda);
    }
    if (dom.btnOpenModalAction) {
      dom.btnOpenModalAction.addEventListener('click', abrirModalNovaDemanda);
    }

    // Slide navigation
    dom.btnSlidePrev.addEventListener('click', () => {
      if (state.currentSlideIndex > 0) {
        state.currentSlideIndex--;
        renderSlide();
      }
    });

    dom.btnSlideNext.addEventListener('click', () => {
      if (state.currentSlideIndex < state.acoes.length - 1) {
        state.currentSlideIndex++;
        renderSlide();
      }
    });

    dom.btnSlideFullscreen.addEventListener('click', () => {
      dom.slideWrapper.classList.toggle('fullscreen-mode');
    });

    dom.btnSlideEdit.addEventListener('click', () => {
      if (state.acoes[state.currentSlideIndex]) {
        abrirModalEdicao(state.acoes[state.currentSlideIndex]);
      }
    });

    // Atalhos de Teclado
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        if (state.currentView === 'view-slides' && state.currentSlideIndex > 0) {
          state.currentSlideIndex--;
          renderSlide();
        }
      } else if (e.key === 'ArrowRight') {
        if (state.currentView === 'view-slides' && state.currentSlideIndex < state.acoes.length - 1) {
          state.currentSlideIndex++;
          renderSlide();
        }
      } else if (e.key === 'Escape') {
        dom.slideWrapper.classList.remove('fullscreen-mode');
        fecharModalEdicao();
      }
    });

    // Kanban Drag & Drop
    const cols = [dom.cardsNaoIniciado, dom.cardsEmAndamento, dom.cardsFeito];
    cols.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const actionId = e.dataTransfer.getData('text/plain') || state.draggedActionId;
        const novoStatus = col.dataset.status;
        if (actionId && novoStatus) {
          await atualizarStatusAcao(actionId, novoStatus);
        }
      });
    });

    // Queue search e filtros
    dom.queueSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderQueue();
    });

    dom.filterStatus.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      renderQueue();
    });

    dom.filterCriticidade.addEventListener('change', (e) => {
      state.filterCriticidade = e.target.value;
      renderQueue();
    });

    dom.filterArea.addEventListener('change', (e) => {
      state.filterArea = e.target.value;
      renderQueue();
    });

    // Submissão do Formulário Direto na Tela (SEMPRE ENTRA NO BACKLOG)
    dom.formDirectCreate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = dom.directNome.value.trim();
      const area = dom.directArea.value.trim();
      const solicitante = dom.directSolicitante.value.trim();
      const problema = dom.directProblema.value.trim();
      const oQueFazer = dom.directOqueFazer.value.trim();

      if (!nome) {
        alert('Por favor, preencha o campo "Nome ação".');
        dom.directNome.focus();
        return;
      }
      if (!area) {
        alert('Por favor, preencha o campo "área/departamento".');
        dom.directArea.focus();
        return;
      }
      if (!solicitante) {
        alert('Por favor, preencha o campo "Solicitante".');
        dom.directSolicitante.focus();
        return;
      }
      if (!problema) {
        alert('Por favor, preencha "qual o problema".');
        dom.directProblema.focus();
        return;
      }
      if (!oQueFazer) {
        alert('Por favor, preencha "o que precisar/queremos que seja feito".');
        dom.directOqueFazer.focus();
        return;
      }

      // REGRA: SEMPRE ENTRA NO BACKLOG / NÃO INICIADO
      const novaAcao = {
        nome: nome,
        dataInicio: dom.directDataInicio.value || '',
        dataFim: dom.directDataFim.value || '',
        status: 'Não iniciado',
        criticidade: dom.directCriticidade.value || 'Média',
        area: area,
        solicitante: solicitante,
        problema: problema,
        oQueFazer: oQueFazer
      };

      await salvarAcaoNoBackend(novaAcao, false);
      dom.formDirectCreate.reset();
      dom.directCriticidade.value = 'Média';

      await carregarAcoes();
      renderAll();
      showToast(`Demanda "${nome}" inserida no Backlog!`);
      mudarVisao('view-kanban');
    });

    // Submissão do Modal de Edição (para atualizar ações existentes)
    dom.btnCloseModalAction.addEventListener('click', fecharModalEdicao);
    dom.btnCancelModalAction.addEventListener('click', fecharModalEdicao);

    dom.formAction.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = dom.actionId.value;
      const nome = dom.actionNome.value.trim();
      const area = dom.actionArea.value.trim();
      const solicitante = dom.actionSolicitante.value.trim();
      const problema = dom.actionProblema.value.trim();
      const oQueFazer = dom.actionOqueFazer.value.trim();

      if (!nome || !area || !solicitante || !problema || !oQueFazer) {
        alert('Preencha todos os campos obrigatórios.');
        return;
      }

      const isUpdate = Boolean(id);
      const acaoData = {
        id: id || undefined,
        nome: nome,
        dataInicio: dom.actionDataInicio.value || new Date().toISOString().split('T')[0],
        dataFim: dom.actionDataFim.value || '',
        status: isUpdate ? (dom.actionStatus.value || 'Não iniciado') : 'Não iniciado',
        criticidade: dom.actionCriticidade.value || 'Média',
        area: area,
        solicitante: solicitante,
        problema: problema,
        oQueFazer: oQueFazer
      };

      await salvarAcaoNoBackend(acaoData, isUpdate);
      fecharModalEdicao();
      await carregarAcoes();
      renderAll();
      showToast(isUpdate ? 'Demanda atualizada com sucesso!' : `Demanda "${nome}" inserida no Backlog! Workflow enviado.`);
    });

    // Alternador de Tema (Light Minimalist Sênior vs Dark)
    dom.btnToggleTheme.addEventListener('click', () => {
      const newTheme = state.theme === 'theme-light' ? 'theme-dark' : 'theme-light';
      applyTheme(newTheme);
      renderAnalytics();
    });

    // Exportar JSON
    dom.btnExportJson.addEventListener('click', () => {
      if (state.acoes.length === 0) {
        alert('Não há demandas cadastradas para exportar.');
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.acoes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `demandas_erp_senior_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Arquivo JSON exportado!');
    });
  }

  // HELPERS
  function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    try {
      const parts = dataStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dataStr;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // TOAST NOTIFICATION
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast-notification');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('toast-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('toast-show');
    }, 4500);
  }
  window.showToast = showToast;

  // COPIAR LINK DE ACESSO FIXO PERMANENTE
  window.copiarLinkIntranet = function() {
    const url = 'https://david13079.github.io/simpro-erp/solicitar.html';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link fixo permanente copiado para a área de transferência!');
      }).catch(() => {
        prompt('Copie o link abaixo para compartilhar com a equipe:', url);
      });
    } else {
      prompt('Copie o link abaixo para compartilhar com a equipe:', url);
    }
  };

  // PRÉVIA DO RELATÓRIO MENSAL (DOUGLAS E FEDERIGO)
  window.abrirPreviaRelatorioMensal = async function() {
    const modal = document.getElementById('modal-preview-relatorio');
    const container = document.getElementById('preview-relatorio-container');
    if (!modal || !container) return;

    modal.style.display = 'flex';
    container.innerHTML = '<div style="text-align:center; padding:2.5rem; color:#64748b; font-size:0.9rem;">⏳ Compilando indicadores mensais reais do ERP Sênior...</div>';

    try {
      const resp = await fetch(GAS_ERP_URL + '&action=previa_relatorio_mensal');
      const data = await resp.json();
      if (data.success && data.htmlPreview) {
        container.innerHTML = `
          <div style="background:#ffffff; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            <iframe id="iframe-preview-relatorio" style="width:100%; height:550px; border:none;" srcdoc="${data.htmlPreview.replace(/"/g, '&quot;')}"></iframe>
          </div>
        `;
      } else {
        container.innerHTML = `<div style="color:#ef4444; padding:2rem; text-align:center;">Falha ao compilar relatório: ${data.error || 'Erro desconhecido'}</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444; padding:2rem; text-align:center;">Erro ao conectar ao servidor: ${err.message}</div>`;
    }
  };

  window.fecharPreviaRelatorio = function() {
    const modal = document.getElementById('modal-preview-relatorio');
    if (modal) modal.style.display = 'none';
  };

  // DISPARAR RELATÓRIO MENSAL AGORA
  window.confirmarDisparoRelatorio = async function() {
    const btn = document.getElementById('btn-confirmar-envio-relatorio');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Compilando e Enviando...';
    }

    try {
      const resp = await fetch(GAS_ERP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'disparar_relatorio_mensal' })
      });
      const data = await resp.json();
      if (data.success) {
        showToast('Relatório Mensal compilado e disparado com sucesso para Douglas e Federigo!');
        fecharPreviaRelatorio();
      } else {
        alert('Erro ao disparar relatório: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Erro de conexão ao disparar: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Confirmar Envio para Douglas & Federigo';
      }
    }
  };

  window.dispararRelatorioMensalAgora = function() {
    if (confirm('Deseja compilar os indicadores atuais e disparar o e-mail de fechamento mensal para:\n\n• Douglas Araújo (douglas.araujo@simprodobrasil.com.br)\n• Federigo Daub (federigo.daub@simprodobrasil.com.br)?')) {
      window.confirmarDisparoRelatorio();
    }
  };

  // HISTÓRICO DE DISPAROS DE E-MAILS
  window.abrirHistoricoEmails = async function() {
    const modal = document.getElementById('modal-historico-emails');
    const container = document.getElementById('historico-emails-container');
    if (!modal || !container) return;

    modal.style.display = 'flex';
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b;">Carregando histórico de e-mails...</div>';

    try {
      const resp = await fetch(GAS_ERP_URL + '&action=historico_emails');
      const data = await resp.json();
      if (data.success && data.data) {
        if (data.data.length === 0) {
          container.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b;">Nenhum disparo de e-mail registrado até o momento.</div>';
          return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:0.75rem;">';
        data.data.forEach((item, idx) => {
          const isWorkflow = item.tipo === 'workflow_nova_demanda';
          const badgeCor = isWorkflow ? '#00A859' : '#0284c7';
          const badgeNome = isWorkflow ? '⚡ Workflow Nova Demanda' : '📊 Relatório Mensal de Indicadores';
          const dataHora = new Date(item.timestamp).toLocaleString('pt-BR');

          html += `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                <span style="background:${badgeCor}15; color:${badgeCor}; font-weight:700; font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:4px; border:1px solid ${badgeCor}40;">
                  ${badgeNome}
                </span>
                <span style="font-size:0.75rem; color:#64748b;">📅 ${dataHora}</span>
              </div>
              <div style="font-weight:700; font-size:0.9rem; color:#0f172a; margin-bottom:0.25rem;">
                ${escapeHtml(item.assunto)}
              </div>
              <div style="font-size:0.78rem; color:#475569; margin-bottom:0.4rem;">
                <strong>Destinatários:</strong> ${(item.destinatarios || []).join(', ')}
              </div>
              <div style="font-size:0.75rem; color:#64748b; display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:0.4rem;">
                <span>Status: <strong style="color:${item.status.includes('enviado') ? '#16a34a' : '#ea580c'}">${item.status}</strong></span>
                ${item.arquivoPreview ? `<a href="/disparos_email/${item.arquivoPreview}" target="_blank" style="color:#00A859; font-weight:700; text-decoration:none;">📄 Abrir E-mail Gerado</a>` : ''}
              </div>
            </div>
          `;
        });
        html += '</div>';
        container.innerHTML = html;
      }
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444; padding:2rem; text-align:center;">Erro: ${err.message}</div>`;
    }
  };

  window.fecharHistoricoEmails = function() {
    const modal = document.getElementById('modal-historico-emails');
    if (modal) modal.style.display = 'none';
  };

  // INICIAR
  document.addEventListener('DOMContentLoaded', init);

})();

