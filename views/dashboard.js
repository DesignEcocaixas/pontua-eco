// Arquivo: views/dashboard.js
const renderLayout = require('./layout');

function escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatarReais(valor) {
    return 'R' + String.fromCharCode(36) + ' ' + parseFloat(valor || 0).toFixed(2).replace('.', ',');
}

module.exports = function renderDashboard(usuario, mesAtual = null, pontos = 0, bonificacao = null, estatisticas = [], todosMeses = []) {
    let content = '';
    let pageScripts = '';

    if (!mesAtual) {
        content = `
        <div class="card card-eco border-0 p-4 p-md-5 text-center bg-white">
            <i class="ph-fill ph-calendar-blank text-muted mb-3" style="font-size: 3rem;"></i>
            <h5 class="text-dark fw-bold">Nenhum mês de produção cadastrado</h5>
            <p class="text-muted small">Vá até a Gestão de Meses e inicie um novo ciclo para começar a pontuar.</p>
            <a href="/meses" class="btn btn-eco mt-2 mx-auto px-4 py-2" style="max-width: 240px; width: 100%;" data-loading-link data-loading-text="Abrindo...">Gerenciar Meses</a>
        </div>`;
    } else {
        bonificacao = bonificacao || { valor: 0, proximaMeta: null, pontosFaltantes: 0 };
        estatisticas = estatisticas || [];

        // Lógica Visual da Gamificação e Barra de Progresso
        let corProgresso = pontos >= 170 ? 'bg-success' : (pontos >= 90 ? 'bg-primary' : 'bg-warning');
        let progressoPercentual = 100;
        if (bonificacao.proximaMeta) {
            const metaTotal = pontos + bonificacao.pontosFaltantes;
            progressoPercentual = metaTotal > 0 ? Math.min(100, Math.max(0, (pontos / metaTotal) * 100)) : 0;
        }

        let medalha = 'ph-medal text-muted';
        let tituloMedalha = 'Iniciante';
        if (pontos >= 170) { medalha = 'ph-trophy text-warning'; tituloMedalha = 'Lenda do Design'; }
        else if (pontos >= 130) { medalha = 'ph-star text-primary'; tituloMedalha = 'Especialista'; }
        else if (pontos >= 90) { medalha = 'ph-fire text-danger'; tituloMedalha = 'Em chamas'; }
        else if (pontos >= 60) { medalha = 'ph-thumbs-up text-success'; tituloMedalha = 'Bom Trabalho'; }

        const badgeStatusMes = mesAtual.status === 'aberto'
            ? '<span class="badge bg-success ms-1 align-middle" style="font-size: 0.7rem;">ABERTO</span>'
            : '<span class="badge bg-secondary ms-1 align-middle" style="font-size: 0.7rem;">FECHADO</span>';

        const opcoesMesesHtml = todosMeses.map(m => `
            <option value="${m.id}" ${m.id === mesAtual.id ? 'selected' : ''}>
                ${escapeHtml(m.nome)} / ${m.ano} ${m.status === 'aberto' ? '(Aberto)' : '(Fechado)'}
            </option>
        `).join('');

        // Monta os cards de produtividade e os templates ocultos dos popovers
        let cardsEstatisticasHtml = '';
        let templatesPopoverHtml = '';

        estatisticas.forEach((est, idx) => {
            const itens = Array.isArray(est.itens) ? est.itens : [];
            const popId = 'ecoPopCat' + idx;
            const linkDestino = est.tipo === 'Ideias Aprovadas' ? '/ideias' : '/meses/' + mesAtual.id;
            const labelDestino = est.tipo === 'Ideias Aprovadas' ? 'Ver banco de ideias' : 'Gerenciar no mês';

            let listaItensHtml = '';
            if (itens.length === 0) {
                listaItensHtml = '<div class="text-muted small py-2 text-center">Nenhum item listado.</div>';
            } else {
                listaItensHtml = itens.map(item => `
                    <div class="eco-pop-item">
                        <div class="eco-pop-item-title">${escapeHtml(item.titulo)}</div>
                        <div class="eco-pop-item-meta">
                            <span>${escapeHtml(item.detalhe || '')}</span>
                            ${item.data ? '<span class="text-muted">' + escapeHtml(item.data) + '</span>' : ''}
                        </div>
                    </div>
                `).join('');
            }

            templatesPopoverHtml += `
            <div id="${popId}" class="d-none">
                <div class="eco-pop-list">
                    ${listaItensHtml}
                </div>
                <div class="eco-pop-footer">
                    <a href="${linkDestino}" class="eco-pop-link">
                        <span>${labelDestino}</span>
                        <i class="ph ph-arrow-right"></i>
                    </a>
                </div>
            </div>`;

            cardsEstatisticasHtml += `
            <div class="col-6 col-md-3">
                <div class="card card-eco eco-dash-stat-card border-0 p-3 bg-white text-center h-100 d-flex flex-column justify-content-between"
                     tabindex="0"
                     role="button"
                     data-popover-target="${popId}"
                     data-popover-title="${escapeHtml(est.tipo)} (${est.qtdRegistros})">
                    <span class="eco-stat-hint" title="Ver lista de itens"><i class="ph ph-list-bullets"></i></span>
                    <div>
                        <div class="fs-2 text-primary fw-bold lh-sm">${est.qtdRegistros}</div>
                        <div class="small text-muted fw-bold text-uppercase mt-1">${escapeHtml(est.tipo)}</div>
                    </div>
                    <div class="mt-2">
                        <span class="badge bg-success">+${est.pontos} pts</span>
                    </div>
                </div>
            </div>`;
        });

        content = `
        <style>
            .eco-dash-stat-card {
                position: relative;
                cursor: pointer;
                border: 1px solid transparent !important;
                transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
            }
            .eco-dash-stat-card:hover,
            .eco-dash-stat-card:focus {
                transform: translateY(-2px);
                box-shadow: 0 6px 18px rgba(11, 107, 58, 0.12);
                border-color: rgba(11, 107, 58, 0.28) !important;
                outline: none;
            }
            .eco-stat-hint {
                position: absolute;
                top: 8px;
                right: 10px;
                color: #adb5bd;
                font-size: 0.9rem;
                transition: color 0.15s ease;
            }
            .eco-dash-stat-card:hover .eco-stat-hint {
                color: var(--eco-green);
            }

            /* Popover com a lista de atividades do card */
            .eco-dash-popover {
                max-width: 300px;
                width: 290px;
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 10px;
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .eco-dash-popover .popover-header {
                background-color: #f8faf9;
                color: var(--eco-green);
                font-weight: 700;
                font-size: 0.82rem;
                border-bottom: 1px solid #e9ecef;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                padding: 9px 12px;
            }
            .eco-dash-popover .popover-body {
                padding: 0;
            }
            .eco-pop-list {
                max-height: 230px;
                overflow-y: auto;
                padding: 6px 12px;
            }
            .eco-pop-item {
                padding: 7px 0;
                border-bottom: 1px solid #f1f3f5;
            }
            .eco-pop-item:last-child {
                border-bottom: none;
            }
            .eco-pop-item-title {
                font-size: 0.8rem;
                font-weight: 600;
                color: #212529;
                line-height: 1.3;
                word-break: break-word;
            }
            .eco-pop-item-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                margin-top: 2px;
                font-size: 0.72rem;
                color: #6c757d;
            }
            .eco-pop-footer {
                padding: 8px 12px;
                background: #fafafa;
                border-top: 1px solid #eef0f3;
                border-bottom-left-radius: 10px;
                border-bottom-right-radius: 10px;
            }
            .eco-pop-link {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--eco-green);
                text-decoration: none;
            }
            .eco-pop-link:hover {
                color: var(--eco-green-light);
                text-decoration: underline;
            }

            /* =========================================================
               ADAPTAÇÕES MOBILE (< 768px)
            ========================================================= */
            @media (max-width: 767.98px) {
                .eco-dash-topbar {
                    flex-direction: column;
                    align-items: stretch !important;
                    gap: 12px !important;
                }
                .eco-dash-controls {
                    display: grid !important;
                    grid-template-columns: 1fr;
                    gap: 8px !important;
                    width: 100%;
                }
                .eco-dash-select-box {
                    width: 100%;
                    min-height: 42px;
                }
                .eco-dash-select-box select {
                    width: 100%;
                    min-width: 0 !important;
                }
                .eco-dash-status-box {
                    width: 100%;
                    justify-content: space-between;
                    min-height: 44px;
                }
                .eco-dash-card-pontos,
                .eco-dash-card-bonus {
                    padding: 1.25rem !important;
                }
                .eco-dash-card-pontos .display-3 {
                    font-size: 2.75rem;
                }
                .eco-dash-bonus-header {
                    flex-direction: column;
                    align-items: flex-start !important;
                    gap: 8px;
                }
                .eco-dash-bonus-meta {
                    text-align: left !important;
                    width: 100%;
                    padding-top: 8px;
                    border-top: 1px dashed #e9ecef;
                }
                .eco-dash-stat-card {
                    padding: 0.85rem !important;
                }
                .eco-dash-stat-card .fs-2 {
                    font-size: 1.65rem !important;
                }
                .eco-dash-popover {
                    max-width: calc(100vw - 28px);
                }
            }
        </style>

        <div class="eco-dash-topbar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h5 class="m-0 fw-bold text-dark d-flex flex-wrap align-items-center gap-1">
                    <span>Resumo do Mês: ${escapeHtml(mesAtual.nome)} / ${mesAtual.ano}</span>
                    ${badgeStatusMes}
                </h5>
                <p class="text-muted m-0 small mt-1">Acompanhe seu progresso, SLA e bonificações.</p>
            </div>

            <div class="eco-dash-controls d-flex flex-wrap align-items-center gap-2">
                <!-- Seletor de Mês -->
                <form id="formFiltroMes" action="/dashboard" method="GET" class="eco-dash-select-box d-flex align-items-center gap-2 bg-white px-3 py-2 rounded shadow-sm border">
                    <i class="ph ph-calendar text-muted fs-5 flex-shrink-0"></i>
                    <select name="mes_id" id="selectMesDashboard" class="form-select form-select-sm border-0 fw-semibold p-0 pe-4 shadow-none" style="min-width: 175px; cursor: pointer;">
                        ${opcoesMesesHtml}
                    </select>
                </form>

                <!-- Medalha / Status -->
                <div class="eco-dash-status-box d-flex align-items-center gap-2 bg-white px-3 py-2 rounded shadow-sm border">
                    <div class="d-flex align-items-center gap-2">
                        <i class="ph-fill ${medalha} fs-4 flex-shrink-0"></i>
                        <div class="d-md-none small text-muted">Status Atual</div>
                    </div>
                    <div class="text-end">
                        <div class="small text-muted lh-1 d-none d-md-block">Status Atual</div>
                        <div class="fw-bold lh-1">${tituloMedalha}</div>
                    </div>
                </div>
            </div>
        </div>

        <div id="dashboardContent" class="eco-loadable">
            <div class="row g-3 mb-4">
                <!-- Card de Pontos -->
                <div class="col-12 col-md-4">
                    <div class="card card-eco eco-dash-card-pontos border-0 p-4 bg-white h-100 text-center d-flex flex-column justify-content-center">
                        <div class="text-muted fw-bold mb-2">Pontuação Consolidada</div>
                        <h1 class="display-3 fw-bold m-0" style="color: var(--eco-green);">${pontos}</h1>
                        <div class="small text-muted mt-1">Pontos aprovados no SLA</div>
                    </div>
                </div>

                <!-- Card de Bonificação e Barra de Progresso -->
                <div class="col-12 col-md-8">
                    <div class="card card-eco eco-dash-card-bonus border-0 p-4 bg-white h-100 d-flex flex-column justify-content-center">
                        <div class="eco-dash-bonus-header d-flex justify-content-between align-items-end mb-2">
                            <div>
                                <div class="text-muted fw-bold mb-1">Bonificação Alcançada</div>
                                <h2 class="text-success fw-bold m-0">${formatarReais(bonificacao.valor)}</h2>
                            </div>
                            ${bonificacao.proximaMeta ? `
                            <div class="eco-dash-bonus-meta text-end">
                                <div class="small text-muted">Próximo Nível (${formatarReais(bonificacao.proximaMeta)})</div>
                                <div class="fw-bold text-primary">Faltam ${bonificacao.pontosFaltantes} pts</div>
                            </div>` : `<div class="eco-dash-bonus-meta fw-bold text-success"><i class="ph-fill ph-check-circle"></i> Bônus Máximo</div>`}
                        </div>

                        <div class="progress mt-3 bg-light" style="height: 12px; border-radius: 10px;">
                            <div class="progress-bar ${corProgresso} progress-bar-striped progress-bar-animated"
                                 role="progressbar"
                                 style="width: ${progressoPercentual.toFixed(1)}%;"
                                 aria-valuenow="${progressoPercentual.toFixed(0)}"
                                 aria-valuemin="0"
                                 aria-valuemax="100">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-1 gap-2">
                            <span class="small text-muted">${pontos} pts acumulados</span>
                            <span class="small fw-semibold text-muted">${progressoPercentual.toFixed(0)}% da meta</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estatísticas Rápidas -->
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-1 mt-4 mb-3">
                <h6 class="fw-bold text-dark m-0">Produtividade do Mês (Aprovados no SLA)</h6>
                ${estatisticas.length > 0 ? '<span class="small text-muted"><i class="ph ph-cursor-click me-1"></i>Passe o mouse ou toque nos cards para ver a lista</span>' : ''}
            </div>
            <div class="row g-2 g-md-3">
                ${cardsEstatisticasHtml}
                ${estatisticas.length === 0 ? '<div class="col-12"><div class="text-muted small">Nenhuma atividade contabilizada para SLA neste mês.</div></div>' : ''}
            </div>

            <!-- Templates ocultos para os Popovers dos Cards -->
            ${templatesPopoverHtml}
        </div>
        `;

        pageScripts = `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                var selectMes = document.getElementById('selectMesDashboard');
                var formFiltro = document.getElementById('formFiltroMes');
                var dashContainer = document.getElementById('dashboardContent');

                if (selectMes && formFiltro) {
                    selectMes.addEventListener('change', function() {
                        if (dashContainer && window.setContainerLoading) {
                            window.setContainerLoading(dashContainer, 'Carregando dados do mês...');
                        }
                        formFiltro.submit();
                    });
                }

                // Popovers interativos nos cards de produtividade (hover no desktop + toque no mobile)
                var statCards = Array.from(document.querySelectorAll('.eco-dash-stat-card[data-popover-target]'));
                var instancias = [];

                function fecharTodosExceto(cardAtual) {
                    instancias.forEach(function(item) {
                        if (item.card !== cardAtual) {
                            clearTimeout(item.timer);
                            item.pop.hide();
                            item.aberto = false;
                        }
                    });
                }

                statCards.forEach(function(card) {
                    var targetId = card.getAttribute('data-popover-target');
                    var title = card.getAttribute('data-popover-title') || '';
                    var tpl = document.getElementById(targetId);
                    if (!tpl || !window.bootstrap || !window.bootstrap.Popover) return;

                    var pop = new bootstrap.Popover(card, {
                        trigger: 'manual',
                        placement: 'auto',
                        container: 'body',
                        html: true,
                        sanitize: false,
                        customClass: 'eco-dash-popover',
                        title: title,
                        content: tpl.innerHTML
                    });

                    var estado = { card: card, pop: pop, timer: null, aberto: false };
                    instancias.push(estado);

                    function abrir() {
                        clearTimeout(estado.timer);
                        fecharTodosExceto(card);
                        if (!estado.aberto) {
                            pop.show();
                            estado.aberto = true;
                        }
                    }

                    function agendarFechamento() {
                        clearTimeout(estado.timer);
                        estado.timer = setTimeout(function() {
                            pop.hide();
                            estado.aberto = false;
                        }, 160);
                    }

                    card.addEventListener('mouseenter', abrir);
                    card.addEventListener('mouseleave', agendarFechamento);

                    card.addEventListener('shown.bs.popover', function() {
                        var popId = card.getAttribute('aria-describedby');
                        var popEl = popId ? document.getElementById(popId) : null;
                        if (popEl && !popEl.dataset.hoverBound) {
                            popEl.dataset.hoverBound = 'true';
                            popEl.addEventListener('mouseenter', function() {
                                clearTimeout(estado.timer);
                            });
                            popEl.addEventListener('mouseleave', agendarFechamento);
                        }
                    });

                    // Suporte a clique/toque (especialmente útil no mobile)
                    card.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (estado.aberto) {
                            clearTimeout(estado.timer);
                            pop.hide();
                            estado.aberto = false;
                        } else {
                            abrir();
                        }
                    });
                });

                document.addEventListener('click', function(e) {
                    if (!e.target.closest('.eco-dash-stat-card') && !e.target.closest('.eco-dash-popover')) {
                        fecharTodosExceto(null);
                    }
                });
            });
        </script>
        `;
    }

    return renderLayout('Dashboard', content, pageScripts, usuario);
};