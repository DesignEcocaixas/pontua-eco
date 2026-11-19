// Arquivo: views/dashboard.js
const renderLayout = require('./layout');

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
                ${m.nome} / ${m.ano} ${m.status === 'aberto' ? '(Aberto)' : '(Fechado)'}
            </option>
        `).join('');

        content = `
        <style>
            .eco-dash-stat-card {
                transition: transform 0.15s ease;
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
            }
        </style>

        <div class="eco-dash-topbar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h5 class="m-0 fw-bold text-dark d-flex flex-wrap align-items-center gap-1">
                    <span>Resumo do Mês: ${mesAtual.nome} / ${mesAtual.ano}</span>
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
                                <h2 class="text-success fw-bold m-0">R$ ${bonificacao.valor.toFixed(2).replace('.', ',')}</h2>
                            </div>
                            ${bonificacao.proximaMeta ? `
                            <div class="eco-dash-bonus-meta text-end">
                                <div class="small text-muted">Próximo Nível (R$ ${bonificacao.proximaMeta.toFixed(2).replace('.', ',')})</div>
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
            <h6 class="fw-bold text-dark mt-4 mb-3">Produtividade do Mês (Aprovados no SLA)</h6>
            <div class="row g-2 g-md-3">
                ${estatisticas.map(est => `
                    <div class="col-6 col-md-3">
                        <div class="card card-eco eco-dash-stat-card border-0 p-3 bg-white text-center h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="fs-2 text-primary fw-bold lh-sm">${est.qtdRegistros}</div>
                                <div class="small text-muted fw-bold text-uppercase mt-1">${est.tipo}</div>
                            </div>
                            <div class="mt-2">
                                <span class="badge bg-success">+${est.pontos} pts</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${estatisticas.length === 0 ? '<div class="col-12"><div class="text-muted small">Nenhuma atividade contabilizada para SLA neste mês.</div></div>' : ''}
            </div>
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
            });
        </script>
        `;
    }

    return renderLayout('Dashboard', content, pageScripts, usuario);
};