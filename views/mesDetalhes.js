// Arquivo: views/mesDetalhes.js
const renderLayout = require('./layout');

function escapeAttr(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatarDataRegistro(rawDate) {
    if (!rawDate) return { iso: '', br: '-' };
    const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (isNaN(d.getTime())) return { iso: '', br: '-' };
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return { iso: `${ano}-${mes}-${dia}`, br: `${dia}/${mes}/${ano}` };
}

function normalizarBusca(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/"/g, '&quot;');
}

module.exports = function renderMesDetalhes(mes, registros, analise, msg = null, tipoMsg = 'success', usuarioLogado = null, bonificacoes = []) {
    let registrosHtml = '';
    
    if (registros.length === 0) {
        registrosHtml = '<tr class="eco-empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhuma atividade ou ideia registrada.</td></tr>';
    } else {
        registros.forEach(reg => {
            let badgeStatus = reg.status === 'aprovado' ? 'bg-success' : (reg.status === 'rejeitado' ? 'bg-danger' : 'bg-warning text-dark');
            let infoExtra = '';
            let acoesHtml = '';
            let pontosExibicao = '<span class="text-muted fst-italic">SLA Mês</span>';

            const dataReg = formatarDataRegistro(reg.created_at || reg.data_criacao || reg.data_registro || reg.data);

            if (reg.isIdeia) {
                infoExtra = `<small class="text-muted d-block"><i class="ph-fill ph-lightbulb"></i> Ideia Aprovada</small>`;
                pontosExibicao = `<span class="fw-bold text-success">+${reg.pontosBonus}</span>`;
                acoesHtml = `
                <div class="eco-reg-acoes-wrap">
                    <a href="/ideias" class="btn btn-sm btn-light border text-primary eco-reg-btn-main" title="Gerenciar Ideia" data-loading-link data-loading-text="Abrindo...">
                        <i class="ph ph-arrow-square-out"></i>
                        <span class="d-md-none ms-1">Gerenciar Ideia</span>
                    </a>
                </div>`;
            } else {
                if (['Post', 'Carrossel', 'Stories', 'Reels'].includes(reg.tipo)) {
                    infoExtra = `<small class="text-muted d-block">Tempo: ${reg.tempo_producao_minutos} min</small>`;
                } else if (reg.tipo === 'Arte de Cliente') {
                    let textoPrazo = (reg.qtd_dias == 72 || reg.qtd_dias == 99) ? '+72h' : `${reg.qtd_dias}h`;
                    infoExtra = `<small class="text-muted d-block">Prazo inf: ${textoPrazo}</small>`;
                } else if (reg.tipo === 'Clichê') {
                    infoExtra = `<small class="text-muted d-block">Dias: ${reg.qtd_dias}</small>`;
                }

                const labelExclusao = reg.cliente ? `${reg.tipo} — ${reg.cliente}` : reg.tipo;
                acoesHtml = `
                <div class="eco-reg-acoes-wrap">
                    <button type="button"
                            class="btn btn-sm btn-light border text-primary eco-reg-btn-main"
                            title="Editar Registro"
                            data-bs-toggle="modal"
                            data-bs-target="#modalEditarRegistro"
                            data-id="${reg.id}"
                            data-tipo="${escapeAttr(reg.tipo)}"
                            data-cliente="${escapeAttr(reg.cliente || '')}"
                            data-alteracoes="${escapeAttr(reg.qtd_alteracoes ?? 0)}"
                            data-tempo="${escapeAttr(reg.tempo_producao_minutos ?? 0)}"
                            data-dias="${escapeAttr(reg.qtd_dias ?? 0)}"
                            data-descricao="${escapeAttr(reg.descricao || '')}">
                        <i class="ph ph-pencil-simple"></i>
                        <span class="d-md-none ms-1">Editar</span>
                    </button>
                    <button type="button"
                            class="btn btn-sm btn-light border text-danger eco-reg-btn-icon"
                            title="Excluir Registro"
                            data-bs-toggle="modal"
                            data-bs-target="#modalConfirmarExclusaoRegistro"
                            data-id="${reg.id}"
                            data-label="${escapeAttr(labelExclusao)}">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>`;
            }

            const textoBusca = normalizarBusca(`${reg.tipo} ${reg.cliente || ''} ${reg.descricao || ''} ${reg.status} ${dataReg.br}`);
            const labelAlteracoesMobile = reg.isIdeia ? '' : '<span class="d-md-none text-muted me-1">Alterações:</span>';

            registrosHtml += `
            <tr class="eco-registro-row" data-search="${textoBusca}" data-date="${dataReg.iso}">
                <td class="ps-3 align-middle fw-bold eco-reg-tipo">${reg.tipo}</td>
                <td class="align-middle eco-reg-cliente">${reg.cliente || '-'}</td>
                <td class="align-middle text-muted small eco-reg-data">
                    <i class="ph ph-calendar-blank d-md-none me-1"></i>${dataReg.br}
                </td>
                <td class="align-middle eco-reg-dados">
                    <span class="eco-reg-dados-alt">${labelAlteracoesMobile}<strong>${reg.qtd_alteracoes}</strong></span>
                    ${infoExtra}
                </td>
                <td class="align-middle eco-reg-pontos">${pontosExibicao}</td>
                <td class="align-middle eco-reg-status"><span class="badge ${badgeStatus}">${reg.status.toUpperCase()}</span></td>
                <td class="pe-3 align-middle text-end text-nowrap eco-reg-acoes">${acoesHtml}</td>
            </tr>`;
        });
    }

    let analiseHtml = analise.analiseCategorias.map(c => {
        let richDetails = c.isArteCliente ? `
            <div class="mt-2 small text-dark" style="background-color: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0;">
                <div class="d-flex justify-content-between mb-1"><span class="text-muted">Média de Alterações:</span> <span class="fw-bold">${c.mediaAlt}</span></div>
                <div class="d-flex justify-content-between mb-1"><span class="text-muted">Entregas em até 24h:</span> <span class="fw-bold text-success">${c.perc24h}%</span></div>
                <div class="d-flex justify-content-between mb-2"><span class="text-muted">Entregas em até 48h:</span> <span class="fw-bold text-primary">${c.perc48h}%</span></div>
                <div class="border-top pt-2 mt-1"><i class="ph-fill ph-info text-primary"></i> <strong>Regra:</strong> ${c.justificativa}</div>
            </div>` : `<span class="small text-muted d-block mt-1">${c.mensagem}</span>`;
        return `
        <div class="d-flex justify-content-between align-items-start gap-2 mb-3 pb-3 border-bottom eco-sla-item">
            <div class="flex-grow-1 min-w-0">
                <span class="fw-bold d-block text-dark">${c.tipo} <span class="badge bg-secondary ms-1 fw-normal">${c.qtdRegistros} aprovados</span></span>
                ${richDetails}
            </div>
            <div class="fw-bold text-success fs-4 flex-shrink-0">+${c.pontos}</div>
        </div>`;
    }).join('');

    // Tabela dinâmica de Faixas de Bonificação (destacando a faixa atual do mês)
    let bonificacoesRegrasHtml = '';
    if (!bonificacoes || bonificacoes.length === 0) {
        bonificacoesRegrasHtml = `
            <tr>
                <td colspan="3" class="text-center text-muted py-4">
                    Nenhuma faixa de bonificação cadastrada nas Configurações.
                </td>
            </tr>`;
    } else {
        bonificacoes.forEach(b => {
            const min = parseInt(b.pontos_min, 10);
            const max = parseInt(b.pontos_max, 10);
            const atingida = analise.totalConsolidado >= min && analise.totalConsolidado <= max;
            const textoFaixa = max >= 9999 ? `A partir de ${min} pts` : `De ${min} a ${max} pts`;
            const valorFormatado = `R$ ${parseFloat(b.valor).toFixed(2).replace('.', ',')}`;

            bonificacoesRegrasHtml += `
            <tr class="${atingida ? 'table-success' : ''}">
                <td class="ps-3 align-middle fw-semibold text-dark">${textoFaixa}</td>
                <td class="align-middle fw-bold text-success text-nowrap">${valorFormatado}</td>
                <td class="pe-3 align-middle text-end">
                    ${atingida
                        ? '<span class="badge bg-success"><i class="ph-fill ph-check-circle"></i> Faixa Atual</span>'
                        : (analise.totalConsolidado < min
                            ? `<span class="small text-muted">Faltam ${min - analise.totalConsolidado} pts</span>`
                            : '<span class="small text-muted">Superada</span>')}
                </td>
            </tr>`;
        });
    }

    const opcoesTipoRegistro = `
        <option value="Post">Post</option>
        <option value="Carrossel">Carrossel</option>
        <option value="Stories">Stories</option>
        <option value="Reels">Reels</option>
        <option value="Arte Fantasia">Arte Fantasia</option>
        <option value="Arte de Cliente">Arte de Cliente</option>
        <option value="Clichê">Clichê</option>
    `;

    const content = `
    <style>
        .eco-pagination .page-link { color: var(--eco-green); border-color: #dee2e6; font-weight: 500; }
        .eco-pagination .page-link:hover { background-color: rgba(11, 107, 58, 0.08); color: var(--eco-green); }
        .eco-pagination .page-item.active .page-link { background-color: var(--eco-green); border-color: var(--eco-green); color: #fff; }
        .eco-pagination .page-item.disabled .page-link { color: #adb5bd; background-color: #fff; }

        .eco-reg-acoes-wrap {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .eco-reg-dados-alt strong {
            font-weight: 500;
        }

        /* Mantém os filtros em linha única no tablet/desktop */
        @media (min-width: 768px) {
            #filtrosExtrasRegistros.collapse,
            #filtrosExtrasRegistros .eco-filtros-inner {
                display: contents !important;
                height: auto !important;
                visibility: visible !important;
            }
        }

        /* =========================================================
           ADAPTAÇÕES MOBILE (< 768px)
        ========================================================= */
        @media (max-width: 767.98px) {
            .eco-detalhes-topbar {
                flex-direction: column;
                align-items: stretch !important;
                gap: 12px !important;
            }
            .eco-detalhes-actions {
                display: grid !important;
                grid-template-columns: 1fr 1fr;
                gap: 8px !important;
                width: 100%;
            }
            .eco-detalhes-actions .btn {
                min-height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .eco-detalhes-actions .eco-btn-novo-reg {
                grid-column: 1 / -1;
            }

            /* Cards de resumo mais equilibrados na tela do celular */
            #cardResumoMes {
                padding: 1.25rem !important;
            }
            #cardResumoMes .display-3 {
                font-size: 2.75rem;
            }
            #cardSlaCategorias {
                max-height: 340px !important;
            }
            .eco-sla-item:last-child {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
                border-bottom: none !important;
            }

            /* Tabela de Registros vira lista de cards sem scroll horizontal */
            #cardTabelaRegistros .table-responsive {
                overflow-x: visible;
            }
            #cardTabelaRegistros table,
            #cardTabelaRegistros tbody {
                display: block;
                width: 100%;
            }
            #cardTabelaRegistros thead {
                display: none;
            }
            #cardTabelaRegistros tr.eco-registro-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 6px 10px;
                padding: 14px;
                border-bottom: 1px solid #eef0f3;
                background: #fff;
            }
            #cardTabelaRegistros tr.eco-registro-row:last-of-type {
                border-bottom: none;
            }
            #cardTabelaRegistros tr.eco-registro-row td {
                display: block;
                border: none;
                padding: 0 !important;
                white-space: normal !important;
            }
            #cardTabelaRegistros td.eco-reg-tipo {
                grid-column: 1;
                grid-row: 1;
                font-size: 0.95rem;
                color: #212529;
            }
            #cardTabelaRegistros td.eco-reg-status {
                grid-column: 2;
                grid-row: 1;
                justify-self: end;
                align-self: center;
            }
            #cardTabelaRegistros td.eco-reg-cliente {
                grid-column: 1 / -1;
                grid-row: 2;
                font-size: 0.85rem;
                color: #495057;
                word-break: break-word;
            }
            #cardTabelaRegistros td.eco-reg-data {
                grid-column: 1;
                grid-row: 3;
                font-size: 0.78rem;
                align-self: center;
            }
            #cardTabelaRegistros td.eco-reg-pontos {
                grid-column: 2;
                grid-row: 3;
                justify-self: end;
                align-self: center;
                font-size: 0.85rem;
            }
            #cardTabelaRegistros td.eco-reg-dados {
                grid-column: 1 / -1;
                grid-row: 4;
                background: #f8f9fa;
                border: 1px solid #edf0f2 !important;
                border-radius: 6px;
                padding: 8px 10px !important;
                margin-top: 2px;
                display: flex !important;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 4px 12px;
                font-size: 0.82rem;
            }
            #cardTabelaRegistros td.eco-reg-dados small {
                display: inline !important;
            }
            #cardTabelaRegistros td.eco-reg-acoes {
                grid-column: 1 / -1;
                grid-row: 5;
                text-align: left !important;
                margin-top: 4px;
            }
            #cardTabelaRegistros .eco-reg-acoes-wrap {
                display: flex;
                width: 100%;
                gap: 8px;
            }
            #cardTabelaRegistros .eco-reg-btn-main {
                flex: 1 1 auto;
                min-height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            }
            #cardTabelaRegistros .eco-reg-btn-icon {
                width: 38px;
                height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                font-size: 1rem;
            }
            #cardTabelaRegistros tr.eco-empty-row,
            #cardTabelaRegistros tr#emptyFilterRowRegistros {
                display: block;
                width: 100%;
            }
            #cardTabelaRegistros tr.eco-empty-row td,
            #cardTabelaRegistros tr#emptyFilterRowRegistros td {
                display: block;
                width: 100%;
                border: none;
            }

            /* Rodapé de paginação centralizado */
            #footerPaginacaoRegistros {
                flex-direction: column;
                align-items: center !important;
                text-align: center;
                padding: 12px !important;
                gap: 10px !important;
            }
            .eco-pagination .page-link {
                min-width: 36px;
                min-height: 36px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            /* Rodapés de modais confortáveis para toque */
            #modalRegistro .modal-footer .btn,
            #modalEditarRegistro .modal-footer .btn {
                min-height: 38px;
            }
            #modalEditarRegistro .modal-footer {
                display: flex;
                gap: 8px;
            }
            #modalEditarRegistro .modal-footer .btn {
                flex: 1 1 0;
                margin: 0;
            }
            #modalRegistro .modal-footer .btn {
                width: 100%;
            }

            /* Abas do Modal de Regras empilháveis em telas muito estreitas */
            #regrasTabs .nav-link {
                font-size: 0.8rem;
                padding: 8px 6px !important;
            }
        }
    </style>

    <div class="eco-detalhes-topbar d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
            <h5 class="m-0 fw-bold text-dark">Gestão: ${mes.nome} / ${mes.ano}</h5>
            <p class="text-muted m-0 small">A pontuação é calculada de forma unificada baseada na média de entregas (SLA).</p>
        </div>
        <div class="eco-detalhes-actions d-flex flex-wrap align-items-center gap-2">
            <a href="/meses" class="btn btn-sm btn-light border" data-loading-link data-loading-text="Voltando..."><i class="ph ph-arrow-left"></i> Voltar</a>
            <button type="button" class="btn btn-sm btn-light border fw-semibold" data-bs-toggle="modal" data-bs-target="#modalRegras">
                <i class="ph-fill ph-book-open text-success"></i> Regras
            </button>
            ${mes.status === 'aberto' ? `<button class="btn btn-sm btn-eco fw-bold px-3 eco-btn-novo-reg" data-bs-toggle="modal" data-bs-target="#modalRegistro"><i class="ph ph-plus-circle"></i> Novo Registro</button>` : ''}
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-5">
            <div id="cardResumoMes" class="card card-eco eco-loadable border-0 p-4 bg-white h-100 text-center d-flex justify-content-center">
                <div class="text-muted fw-bold mb-1">Pontuação Total do Mês</div>
                <h1 class="display-3 text-success fw-bold m-0">${analise.totalConsolidado}</h1>
                <div class="small text-muted mt-2">Calculada via Desempenho Global (SLA)</div>
            </div>
        </div>
        <div class="col-md-7">
            <div id="cardSlaCategorias" class="card card-eco eco-loadable border-0 p-3 bg-white h-100" style="max-height: 400px; overflow-y: auto;">
                <div class="text-muted small fw-bold mb-3">SLA e Desempenho por Categoria</div>
                ${analiseHtml || '<div class="text-muted small">Nenhuma atividade registrada ainda para análise.</div>'}
            </div>
        </div>
    </div>

    <div id="cardTabelaRegistros" class="card card-eco eco-loadable mb-4">
        <!-- Barra de Pesquisa e Filtro de Data -->
        <div class="card-header bg-white py-3 border-bottom">
            <div class="row g-2 align-items-end">
                <div class="col-12 col-md-12 col-lg-4">
                    <label for="buscaRegistros" class="form-label small fw-semibold text-muted mb-1">Pesquisar</label>
                    <div class="d-flex gap-2">
                        <div class="input-group input-group-sm flex-grow-1">
                            <span class="input-group-text bg-light border-end-0 text-muted"><i class="ph ph-magnifying-glass"></i></span>
                            <input type="text" id="buscaRegistros" class="form-control border-start-0" placeholder="Atividade, cliente ou status...">
                        </div>
                        <button type="button"
                                class="btn btn-sm btn-light border d-md-none d-inline-flex align-items-center gap-1 flex-shrink-0 px-2"
                                data-bs-toggle="collapse"
                                data-bs-target="#filtrosExtrasRegistros"
                                aria-expanded="false"
                                aria-controls="filtrosExtrasRegistros">
                            <i class="ph ph-funnel"></i>
                            <span class="small fw-semibold">Filtros</span>
                            <span id="badgeFiltrosRegistros" class="badge bg-success rounded-pill d-none" style="font-size: 0.65rem;">0</span>
                        </button>
                    </div>
                </div>

                <!-- No mobile fica recolhido sob "Filtros"; no tablet/desktop fica visível na linha -->
                <div id="filtrosExtrasRegistros" class="collapse col-12">
                    <div class="row g-2 align-items-end eco-filtros-inner pt-2 pt-md-0">
                        <div class="col-6 col-md-4 col-lg-3">
                            <label for="dataDeRegistros" class="form-label small fw-semibold text-muted mb-1">De:</label>
                            <input type="date" id="dataDeRegistros" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-4 col-lg-3">
                            <label for="dataParaRegistros" class="form-label small fw-semibold text-muted mb-1">Para:</label>
                            <input type="date" id="dataParaRegistros" class="form-control form-control-sm">
                        </div>
                        <div class="col-12 col-md-4 col-lg-2 d-flex gap-2">
                            <div class="flex-grow-1">
                                <label for="porPaginaRegistros" class="form-label small fw-semibold text-muted mb-1">Exibir</label>
                                <select id="porPaginaRegistros" class="form-select form-select-sm">
                                    <option value="10" selected>10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <div class="d-flex align-items-end">
                                <button type="button" id="btnLimparRegistros" class="btn btn-sm btn-light border" style="min-height: 31px;" title="Limpar filtros">
                                    <i class="ph ph-eraser"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover table-sm m-0" style="font-size: 0.85rem;">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-3">Atividade</th>
                            <th>Cliente/Título</th>
                            <th>Data</th>
                            <th>Dados (Alt/Tempo)</th>
                            <th>Pontuação</th>
                            <th>Status</th>
                            <th class="text-end pe-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyRegistros">
                        ${registrosHtml}
                        <tr id="emptyFilterRowRegistros" class="d-none">
                            <td colspan="7" class="text-center text-muted py-4">
                                <i class="ph ph-funnel-x me-1"></i> Nenhum registro encontrado para os filtros aplicados.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Rodapé com Paginação Inteligente -->
        <div id="footerPaginacaoRegistros" class="card-footer bg-white py-2 px-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
            <small id="infoPaginacaoRegistros" class="text-muted"></small>
            <nav aria-label="Paginação de registros">
                <ul id="paginacaoRegistros" class="pagination pagination-sm eco-pagination m-0"></ul>
            </nav>
        </div>
    </div>
    
    <!-- Modal Novo Registro -->
    <div class="modal fade" id="modalRegistro" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <form class="modal-content eco-loadable" action="/meses/${mes.id}/registros" method="POST" data-loading-text="Salvando e recalculando SLA...">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold" style="color: var(--eco-green);">Nova Atividade</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light pt-3">
                    <div class="row g-2">
                        <div class="col-12 col-md-4">
                            <label class="form-label small fw-bold">Tipo de Registro</label>
                            <select name="tipo" id="tipoRegistro" class="form-select form-select-sm" required>
                                <option value="" selected disabled>Selecione...</option>
                                ${opcoesTipoRegistro}
                            </select>
                        </div>
                        <div class="col-12 col-md-8 grupo-comum">
                            <label class="form-label small fw-bold">Cliente / Título</label>
                            <input type="text" name="cliente" class="form-control form-control-sm" placeholder="Nome do Cliente ou Tema">
                        </div>

                        <div class="col-6 col-md-4 grupo-alteracoes" style="display:none;">
                            <label class="form-label small fw-bold">Qtd de Alterações</label>
                            <input type="number" name="qtd_alteracoes" class="form-control form-control-sm" value="0" min="0">
                        </div>

                        <div class="col-6 col-md-4 grupo-tempo" style="display:none;">
                            <label class="form-label small fw-bold">Tempo de Prod. (Min)</label>
                            <input type="number" name="tempo_producao_minutos" class="form-control form-control-sm" placeholder="Ex: 30" min="0">
                        </div>

                        <div class="col-6 col-md-4 grupo-prazo-horas" style="display:none;">
                            <label class="form-label small fw-bold">Prazo Entregue</label>
                            <select name="prazo_horas" class="form-select form-select-sm">
                                <option value="24">Até 24h</option>
                                <option value="48">Até 48h</option>
                                <option value="72">+72h (Acima de 48h)</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-4 grupo-dias" style="display:none;">
                            <label class="form-label small fw-bold">Dias Corridos</label>
                            <input type="number" name="qtd_dias" class="form-control form-control-sm" value="1" min="0">
                        </div>

                        <div class="col-12">
                            <label class="form-label small fw-bold">Observações / Descrição</label>
                            <textarea name="descricao" class="form-control form-control-sm" rows="2"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="submit" class="btn btn-sm btn-eco fw-bold px-4" data-loading-text="Salvando...">Salvar Registro</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Editar Registro -->
    <div class="modal fade" id="modalEditarRegistro" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <form id="formEditarRegistro" class="modal-content eco-loadable" method="POST" data-loading-text="Salvando e recalculando SLA..." data-loading-targets="#cardResumoMes, #cardSlaCategorias, #cardTabelaRegistros">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold text-primary">
                        <i class="ph ph-pencil-simple me-1"></i> Editar Atividade
                    </h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light pt-3">
                    <div class="row g-2">
                        <div class="col-12 col-md-4">
                            <label class="form-label small fw-bold">Tipo de Registro</label>
                            <select name="tipo" id="editTipoRegistro" class="form-select form-select-sm" required>
                                ${opcoesTipoRegistro}
                            </select>
                        </div>
                        <div class="col-12 col-md-8">
                            <label class="form-label small fw-bold">Cliente / Título</label>
                            <input type="text" name="cliente" id="editClienteRegistro" class="form-control form-control-sm" placeholder="Nome do Cliente ou Tema">
                        </div>

                        <div class="col-6 col-md-4 edit-grupo-alteracoes" style="display:none;">
                            <label class="form-label small fw-bold">Qtd de Alterações</label>
                            <input type="number" name="qtd_alteracoes" id="editAlteracoesRegistro" class="form-control form-control-sm" value="0" min="0">
                        </div>

                        <div class="col-6 col-md-4 edit-grupo-tempo" style="display:none;">
                            <label class="form-label small fw-bold">Tempo de Prod. (Min)</label>
                            <input type="number" name="tempo_producao_minutos" id="editTempoRegistro" class="form-control form-control-sm" placeholder="Ex: 30" min="0">
                        </div>

                        <div class="col-6 col-md-4 edit-grupo-prazo-horas" style="display:none;">
                            <label class="form-label small fw-bold">Prazo Entregue</label>
                            <select name="prazo_horas" id="editPrazoRegistro" class="form-select form-select-sm">
                                <option value="24">Até 24h</option>
                                <option value="48">Até 48h</option>
                                <option value="72">+72h (Acima de 48h)</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-4 edit-grupo-dias" style="display:none;">
                            <label class="form-label small fw-bold">Dias Corridos</label>
                            <input type="number" name="qtd_dias" id="editDiasRegistro" class="form-control form-control-sm" value="1" min="0">
                        </div>

                        <div class="col-12">
                            <label class="form-label small fw-bold">Observações / Descrição</label>
                            <textarea name="descricao" id="editDescricaoRegistro" class="form-control form-control-sm" rows="2"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-sm btn-light border" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-primary fw-bold px-4" data-loading-text="Salvando...">Salvar Alterações</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Confirmar Exclusão de Registro -->
    <div class="modal fade" id="modalConfirmarExclusaoRegistro" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <form id="formExcluirRegistro" class="modal-content eco-loadable border-0 shadow" method="POST" data-loading-text="Excluindo e recalculando SLA..." data-loading-targets="#cardResumoMes, #cardSlaCategorias, #cardTabelaRegistros">
                <div class="modal-body text-center p-4">
                    <div class="mb-2">
                        <i class="ph-fill ph-warning-circle text-danger" style="font-size: 2.8rem;"></i>
                    </div>
                    <h6 class="fw-bold text-dark mb-1">Excluir Registro?</h6>
                    <p class="small text-muted mb-2">
                        Deseja realmente remover <strong id="excluirRegistroLabel" class="text-dark"></strong>?
                    </p>
                    <p class="small text-muted mb-0">
                        A pontuação do SLA deste mês será recalculada automaticamente.
                    </p>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center gap-2 pb-3">
                    <button type="button" class="btn btn-sm btn-light border px-3" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-danger fw-bold px-3" data-loading-text="Excluindo...">Sim, Excluir</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Regras de Pontuação e Bonificação -->
    <div class="modal fade" id="modalRegras" tabindex="-1" aria-labelledby="modalRegrasLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-bottom bg-white">
                    <div>
                        <h6 class="modal-title fw-bold mb-0" id="modalRegrasLabel" style="color: var(--eco-green);">
                            <i class="ph-fill ph-book-open me-1"></i> Regras de Pontuação (SLA) e Bonificação
                        </h6>
                        <small class="text-muted">A pontuação é calculada por categoria considerando todos os registros do mês.</small>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>

                <div class="modal-body bg-light p-3">
                    <ul class="nav nav-pills nav-fill bg-white p-1 rounded border mb-3" id="regrasTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active btn-sm fw-semibold py-2" id="tab-sla-btn" data-bs-toggle="pill" data-bs-target="#tab-sla" type="button" role="tab">
                                <i class="ph ph-list-checks"></i> Regras (SLA)
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link btn-sm fw-semibold py-2" id="tab-bonus-btn" data-bs-toggle="pill" data-bs-target="#tab-bonus" type="button" role="tab">
                                <i class="ph ph-currency-dollar"></i> Bonificação (R$)
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content">
                        <div class="tab-pane fade show active" id="tab-sla" role="tabpanel">
                            <div class="alert alert-light border small py-2 px-3 mb-3">
                                <i class="ph-fill ph-info text-success me-1"></i>
                                <strong>Regra da Maioria:</strong> sempre significa <strong>mais de 50%</strong> dos registros da categoria no mês. A pontuação de cada categoria nunca fica abaixo de <strong>0 pts</strong>.
                            </div>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card border-0 shadow-sm h-100">
                                        <div class="card-body p-3">
                                            <div class="fw-bold text-dark mb-1">
                                                <i class="ph-fill ph-instagram-logo text-success me-1"></i> Post, Carrossel, Stories e Reels
                                            </div>
                                            <p class="small text-muted mb-2">Calculado pela média de alterações (arredondada para baixo):</p>
                                            <table class="table table-sm table-borderless small mb-2">
                                                <tbody>
                                                    <tr class="border-bottom"><td>Média 0 alterações</td><td class="text-end fw-bold text-success text-nowrap">30 pts</td></tr>
                                                    <tr class="border-bottom"><td>Média 1 alteração</td><td class="text-end fw-bold text-success text-nowrap">20 pts</td></tr>
                                                    <tr class="border-bottom"><td>Média 2 alterações</td><td class="text-end fw-bold text-success text-nowrap">15 pts</td></tr>
                                                    <tr class="border-bottom"><td>Média 3 alterações</td><td class="text-end fw-bold text-success text-nowrap">10 pts</td></tr>
                                                    <tr><td>Média 4 ou mais alterações</td><td class="text-end fw-bold text-warning text-nowrap">5 pts</td></tr>
                                                </tbody>
                                            </table>
                                            <div class="bg-light rounded p-2 small border">
                                                <strong>SLA de Tempo:</strong> até <strong>30 min</strong> (Post, Stories, Reels) ou até <strong>120 min</strong> (Carrossel). Se a maioria ultrapassar o prazo, aplica-se <span class="text-danger fw-bold">-5 pts</span>.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="card border-0 shadow-sm h-100">
                                        <div class="card-body p-3">
                                            <div class="fw-bold text-dark mb-1">
                                                <i class="ph-fill ph-sparkle text-success me-1"></i> Arte Fantasia
                                            </div>
                                            <p class="small text-muted mb-2">Calculado pela média de alterações (arredondada para baixo):</p>
                                            <table class="table table-sm table-borderless small mb-0">
                                                <tbody>
                                                    <tr class="border-bottom"><td>Média 0 alterações</td><td class="text-end fw-bold text-success text-nowrap">40 pts</td></tr>
                                                    <tr class="border-bottom"><td>Média 1 alteração</td><td class="text-end fw-bold text-success text-nowrap">30 pts</td></tr>
                                                    <tr class="border-bottom"><td>Média 2 alterações</td><td class="text-end fw-bold text-success text-nowrap">20 pts</td></tr>
                                                    <tr class="border-bottom"><td>Média 3 alterações</td><td class="text-end fw-bold text-success text-nowrap">10 pts</td></tr>
                                                    <tr><td>Média 4 ou mais alterações</td><td class="text-end fw-bold text-warning text-nowrap">5 pts</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="card border-0 shadow-sm">
                                        <div class="card-body p-3">
                                            <div class="fw-bold text-dark mb-1">
                                                <i class="ph-fill ph-paint-brush text-success me-1"></i> Arte de Cliente
                                            </div>
                                            <p class="small text-muted mb-2">Avaliado da maior para a menor faixa, combinando <strong>prazo da maioria</strong> e <strong>média exata de alterações</strong> (entregas em até 24h também contam no acumulado de até 48h):</p>
                                            <table class="table table-sm table-borderless small mb-0">
                                                <tbody>
                                                    <tr class="border-bottom"><td>Maioria entregue em até <strong>24h</strong> e média exata de <strong>0</strong> alterações</td><td class="text-end fw-bold text-success text-nowrap">50 pts</td></tr>
                                                    <tr class="border-bottom"><td>Maioria entregue em até <strong>48h</strong> e média exata de <strong>0</strong> alterações</td><td class="text-end fw-bold text-success text-nowrap">40 pts</td></tr>
                                                    <tr class="border-bottom"><td>Maioria entregue em até <strong>24h</strong> e média de até <strong>1</strong> alteração</td><td class="text-end fw-bold text-success text-nowrap">35 pts</td></tr>
                                                    <tr class="border-bottom"><td>Maioria entregue em até <strong>48h</strong> e média de até <strong>2</strong> alterações</td><td class="text-end fw-bold text-success text-nowrap">30 pts</td></tr>
                                                    <tr class="border-bottom"><td>Maioria entregue em até <strong>48h</strong> e média de até <strong>3</strong> alterações</td><td class="text-end fw-bold text-success text-nowrap">25 pts</td></tr>
                                                    <tr><td>Média acima de 3 alterações ou maioria acima de 48h</td><td class="text-end fw-bold text-danger text-nowrap">0 pts</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="card border-0 shadow-sm h-100">
                                        <div class="card-body p-3">
                                            <div class="fw-bold text-dark mb-1">
                                                <i class="ph-fill ph-stamp text-success me-1"></i> Clichê
                                            </div>
                                            <p class="small text-muted mb-2">Calculado pelo prazo em dias corridos da maioria:</p>
                                            <table class="table table-sm table-borderless small mb-0">
                                                <tbody>
                                                    <tr class="border-bottom"><td>Maioria em <strong>menos de 10 dias</strong></td><td class="text-end fw-bold text-success text-nowrap">50 pts</td></tr>
                                                    <tr class="border-bottom"><td>Maioria em até <strong>10 dias</strong> (limite exato)</td><td class="text-end fw-bold text-success text-nowrap">30 pts</td></tr>
                                                    <tr><td>Maioria acima de 10 dias</td><td class="text-end fw-bold text-danger text-nowrap">0 pts</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="card border-0 shadow-sm h-100">
                                        <div class="card-body p-3">
                                            <div class="fw-bold text-dark mb-1">
                                                <i class="ph-fill ph-lightbulb text-warning me-1"></i> Banco de Ideias (Bônus)
                                            </div>
                                            <p class="small text-muted mb-2">
                                                Ideias sugeridas e <strong>aprovadas</strong> pelo administrador vinculadas a este mês somam pontos extras diretamente na pontuação consolidada.
                                            </p>
                                            <div class="bg-light rounded p-2 small border">
                                                <strong>Pontuação:</strong> definida na aprovação de cada ideia (<strong>+pontos bônus</strong> cumulativos).
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-bonus" role="tabpanel">
                            <div class="card border-0 shadow-sm">
                                <div class="card-body p-0">
                                    <div class="p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white rounded-top">
                                        <span class="small text-muted">Valores configurados no sistema com base na pontuação total do mês:</span>
                                        <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">
                                            Atual: ${analise.totalConsolidado} pts
                                        </span>
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table table-hover table-sm m-0" style="font-size: 0.85rem;">
                                            <thead class="table-light">
                                                <tr>
                                                    <th class="ps-3 py-2">Intervalo de Pontuação</th>
                                                    <th class="py-2">Bonificação (R$)</th>
                                                    <th class="pe-3 py-2 text-end">Situação no Mês</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${bonificacoesRegrasHtml}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-top bg-white">
                    <button type="button" class="btn btn-sm btn-secondary px-4 w-100 w-sm-auto" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>
    `;

    const scriptFormulario = `
    <script>
        function atualizarCamposPorTipo(val, prefixo) {
            var seletores = [
                '.' + prefixo + 'grupo-alteracoes',
                '.' + prefixo + 'grupo-tempo',
                '.' + prefixo + 'grupo-prazo-horas',
                '.' + prefixo + 'grupo-dias'
            ];
            document.querySelectorAll(seletores.join(', ')).forEach(function(el) { el.style.display = 'none'; });

            if (['Post', 'Carrossel', 'Stories', 'Reels'].includes(val)) {
                document.querySelector('.' + prefixo + 'grupo-alteracoes').style.display = 'block';
                document.querySelector('.' + prefixo + 'grupo-tempo').style.display = 'block';
            } else if (val === 'Arte Fantasia') {
                document.querySelector('.' + prefixo + 'grupo-alteracoes').style.display = 'block';
            } else if (val === 'Arte de Cliente') {
                document.querySelector('.' + prefixo + 'grupo-alteracoes').style.display = 'block';
                document.querySelector('.' + prefixo + 'grupo-prazo-horas').style.display = 'block';
            } else if (val === 'Clichê') {
                document.querySelector('.' + prefixo + 'grupo-dias').style.display = 'block';
            }
        }

        var selectTipoNovo = document.getElementById('tipoRegistro');
        if (selectTipoNovo) {
            selectTipoNovo.addEventListener('change', function() {
                atualizarCamposPorTipo(this.value, '');
            });
        }

        var selectTipoEdit = document.getElementById('editTipoRegistro');
        if (selectTipoEdit) {
            selectTipoEdit.addEventListener('change', function() {
                atualizarCamposPorTipo(this.value, 'edit-');
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            // 1. Preenchimento do Modal de Edição de Registro
            var modalEditarReg = document.getElementById('modalEditarRegistro');
            if (modalEditarReg) {
                modalEditarReg.addEventListener('show.bs.modal', function(event) {
                    var btn = event.relatedTarget;
                    if (!btn) return;

                    var id = btn.getAttribute('data-id');
                    var tipo = btn.getAttribute('data-tipo') || 'Post';
                    var diasNum = parseInt(btn.getAttribute('data-dias') || '0', 10);

                    document.getElementById('formEditarRegistro').setAttribute('action', '/meses/${mes.id}/registros/' + id + '/editar');
                    document.getElementById('editTipoRegistro').value = tipo;
                    document.getElementById('editClienteRegistro').value = btn.getAttribute('data-cliente') || '';
                    document.getElementById('editAlteracoesRegistro').value = btn.getAttribute('data-alteracoes') || '0';
                    document.getElementById('editTempoRegistro').value = btn.getAttribute('data-tempo') || '0';
                    document.getElementById('editDiasRegistro').value = diasNum || 1;
                    document.getElementById('editDescricaoRegistro').value = btn.getAttribute('data-descricao') || '';

                    // Normaliza o prazo de Arte de Cliente (24h, 48h ou +72h)
                    var prazoVal = diasNum <= 24 ? '24' : (diasNum <= 48 ? '48' : '72');
                    document.getElementById('editPrazoRegistro').value = prazoVal;

                    atualizarCamposPorTipo(tipo, 'edit-');
                });
            }

            // 2. Preenchimento do Modal de Confirmação de Exclusão de Registro
            var modalExcluirReg = document.getElementById('modalConfirmarExclusaoRegistro');
            if (modalExcluirReg) {
                modalExcluirReg.addEventListener('show.bs.modal', function(event) {
                    var btn = event.relatedTarget;
                    if (!btn) return;
                    var id = btn.getAttribute('data-id');
                    var label = btn.getAttribute('data-label') || 'este registro';
                    document.getElementById('formExcluirRegistro').setAttribute('action', '/meses/${mes.id}/registros/' + id + '/excluir');
                    document.getElementById('excluirRegistroLabel').textContent = label;
                });
            }

            // 3. Pesquisa, Filtro De:/Para: e Paginação Inteligente
            var rows = Array.from(document.querySelectorAll('#tbodyRegistros .eco-registro-row'));
            var inputBusca = document.getElementById('buscaRegistros');
            var inputDe = document.getElementById('dataDeRegistros');
            var inputPara = document.getElementById('dataParaRegistros');
            var selectPorPagina = document.getElementById('porPaginaRegistros');
            var btnLimpar = document.getElementById('btnLimparRegistros');
            var badgeFiltros = document.getElementById('badgeFiltrosRegistros');
            var emptyRow = document.getElementById('emptyFilterRowRegistros');
            var infoEl = document.getElementById('infoPaginacaoRegistros');
            var paginacaoEl = document.getElementById('paginacaoRegistros');
            var footerEl = document.getElementById('footerPaginacaoRegistros');

            if (rows.length === 0) {
                if (footerEl) footerEl.classList.add('d-none');
                return;
            }

            var paginaAtual = 1;

            function normalizar(str) {
                return (str || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
            }

            function atualizarBadgeFiltros() {
                if (!badgeFiltros) return;
                var ativos = 0;
                if (inputDe.value) ativos++;
                if (inputPara.value) ativos++;
                badgeFiltros.textContent = String(ativos);
                badgeFiltros.classList.toggle('d-none', ativos === 0);
            }

            function gerarPaginasInteligentes(atual, total) {
                if (total <= 5) {
                    var simples = [];
                    for (var i = 1; i <= total; i++) simples.push(i);
                    return simples;
                }
                var paginas = [1];
                var inicio = Math.max(2, atual - 1);
                var fim = Math.min(total - 1, atual + 1);
                if (atual <= 3) fim = 4;
                if (atual >= total - 2) inicio = total - 3;

                if (inicio > 2) paginas.push('...');
                for (var p = inicio; p <= fim; p++) paginas.push(p);
                if (fim < total - 1) paginas.push('...');
                paginas.push(total);
                return paginas;
            }

            function aplicarFiltrosEPaginacao(resetarPagina) {
                if (resetarPagina) paginaAtual = 1;
                atualizarBadgeFiltros();

                var termo = normalizar(inputBusca.value);
                var de = inputDe.value;
                var para = inputPara.value;
                var porPagina = parseInt(selectPorPagina.value, 10) || 10;

                var filtradas = rows.filter(function(row) {
                    var texto = row.getAttribute('data-search') || '';
                    var dataIso = row.getAttribute('data-date') || '';

                    if (termo && texto.indexOf(termo) === -1) return false;
                    if (de || para) {
                        if (!dataIso) return false;
                        if (de && dataIso < de) return false;
                        if (para && dataIso > para) return false;
                    }
                    return true;
                });

                var totalFiltrado = filtradas.length;
                var totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));
                if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

                var inicioIdx = (paginaAtual - 1) * porPagina;
                var fimIdx = inicioIdx + porPagina;

                rows.forEach(function(row) { row.classList.add('d-none'); });
                filtradas.slice(inicioIdx, fimIdx).forEach(function(row) { row.classList.remove('d-none'); });

                if (emptyRow) emptyRow.classList.toggle('d-none', totalFiltrado > 0);

                if (totalFiltrado === 0) {
                    infoEl.textContent = 'Mostrando 0 de ' + rows.length + ' registros';
                } else {
                    var exibindoAte = Math.min(fimIdx, totalFiltrado);
                    var sufixoFiltro = totalFiltrado !== rows.length ? ' (filtrado de ' + rows.length + ')' : '';
                    infoEl.textContent = 'Mostrando ' + (inicioIdx + 1) + '–' + exibindoAte + ' de ' + totalFiltrado + ' registros' + sufixoFiltro;
                }

                renderizarBotoes(totalPaginas, totalFiltrado);
            }

            function renderizarBotoes(totalPaginas, totalFiltrado) {
                paginacaoEl.innerHTML = '';
                if (totalFiltrado === 0 || totalPaginas <= 1) return;

                function criarItem(label, pagina, desabilitado, ativo, ariaLabel) {
                    var li = document.createElement('li');
                    li.className = 'page-item' + (desabilitado ? ' disabled' : '') + (ativo ? ' active' : '');
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'page-link';
                    btn.textContent = label;
                    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
                    if (!desabilitado && !ativo && pagina !== null) {
                        btn.addEventListener('click', function() {
                            paginaAtual = pagina;
                            aplicarFiltrosEPaginacao(false);
                        });
                    }
                    li.appendChild(btn);
                    return li;
                }

                paginacaoEl.appendChild(criarItem('‹', paginaAtual - 1, paginaAtual === 1, false, 'Anterior'));

                gerarPaginasInteligentes(paginaAtual, totalPaginas).forEach(function(item) {
                    if (item === '...') {
                        paginacaoEl.appendChild(criarItem('...', null, true, false));
                    } else {
                        paginacaoEl.appendChild(criarItem(String(item), item, false, item === paginaAtual));
                    }
                });

                paginacaoEl.appendChild(criarItem('›', paginaAtual + 1, paginaAtual === totalPaginas, false, 'Próxima'));
            }

            inputBusca.addEventListener('input', function() { aplicarFiltrosEPaginacao(true); });
            inputDe.addEventListener('change', function() { aplicarFiltrosEPaginacao(true); });
            inputPara.addEventListener('change', function() { aplicarFiltrosEPaginacao(true); });
            selectPorPagina.addEventListener('change', function() { aplicarFiltrosEPaginacao(true); });
            btnLimpar.addEventListener('click', function() {
                inputBusca.value = '';
                inputDe.value = '';
                inputPara.value = '';
                selectPorPagina.value = '10';
                aplicarFiltrosEPaginacao(true);
            });

            aplicarFiltrosEPaginacao(true);
        });
    </script>
    `;

    const toastObj = msg ? { msg, tipo: tipoMsg } : null;
    return renderLayout(`Detalhes de ${mes.nome}`, content, scriptFormulario, usuarioLogado, toastObj);
};