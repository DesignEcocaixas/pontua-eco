// Arquivo: views/meses.js
const renderLayout = require('./layout');

const MAPA_MESES = {
    janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
};

function escapeAttr(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function normalizarBusca(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/"/g, '&quot;');
}

function intervaloDoMes(nomeMes, ano) {
    const chave = String(nomeMes || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    const numMes = MAPA_MESES[chave];
    const anoNum = parseInt(ano, 10);
    if (!numMes || isNaN(anoNum)) return { inicio: '', fim: '' };

    const ultimoDia = new Date(anoNum, numMes, 0).getDate();
    const mesPad = String(numMes).padStart(2, '0');
    return {
        inicio: `${anoNum}-${mesPad}-01`,
        fim: `${anoNum}-${mesPad}-${String(ultimoDia).padStart(2, '0')}`
    };
}

module.exports = function renderMeses(meses, msg = null, tipoMsg = 'success', usuarioLogado = null) {
    let mesesHtml = '';
    
    if (meses.length === 0) {
        mesesHtml = '<tr class="eco-empty-row"><td colspan="3" class="text-center text-muted py-4">Nenhum mês cadastrado.</td></tr>';
    } else {
        meses.forEach(mes => {
            const badgeClass = mes.status === 'aberto' ? 'bg-success' : 'bg-secondary';
            const periodo = intervaloDoMes(mes.nome, mes.ano);
            const textoBusca = normalizarBusca(`${mes.nome} ${mes.ano} ${mes.nome}/${mes.ano} ${mes.status}`);

            mesesHtml += `
            <tr class="eco-mes-row" data-search="${textoBusca}" data-start="${periodo.inicio}" data-end="${periodo.fim}">
                <td class="ps-3 align-middle fw-bold text-dark eco-mes-titulo">${mes.nome} / ${mes.ano}</td>
                <td class="align-middle eco-mes-status"><span class="badge ${badgeClass}">${mes.status.toUpperCase()}</span></td>
                <td class="pe-3 align-middle text-end eco-mes-acoes">
                    <div class="eco-mes-acoes-wrap">
                        <a href="/meses/${mes.id}" class="btn btn-sm btn-light border eco-btn-gerenciar" title="Acessar Registros" data-loading-link data-loading-text="Abrindo...">
                            <i class="ph ph-list-dashes text-primary"></i> Gerenciar
                        </a>
                        <button type="button"
                                class="btn btn-sm btn-light border text-primary eco-btn-icon"
                                title="Editar Mês"
                                data-bs-toggle="modal"
                                data-bs-target="#modalEditarMes"
                                data-id="${mes.id}"
                                data-nome="${escapeAttr(mes.nome)}"
                                data-ano="${escapeAttr(mes.ano)}"
                                data-status="${escapeAttr(mes.status)}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button type="button"
                                class="btn btn-sm btn-light border text-danger eco-btn-icon"
                                title="Excluir Mês"
                                data-bs-toggle="modal"
                                data-bs-target="#modalConfirmarExclusaoMes"
                                data-id="${mes.id}"
                                data-label="${escapeAttr(`${mes.nome} / ${mes.ano}`)}">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        });
    }

    const opcoesMesesSelect = `
        <option value="Janeiro">Janeiro</option> <option value="Fevereiro">Fevereiro</option>
        <option value="Março">Março</option> <option value="Abril">Abril</option>
        <option value="Maio">Maio</option> <option value="Junho">Junho</option>
        <option value="Julho">Julho</option> <option value="Agosto">Agosto</option>
        <option value="Setembro">Setembro</option> <option value="Outubro">Outubro</option>
        <option value="Novembro">Novembro</option> <option value="Dezembro">Dezembro</option>
    `;

    const content = `
    <style>
        .eco-pagination .page-link { color: var(--eco-green); border-color: #dee2e6; font-weight: 500; }
        .eco-pagination .page-link:hover { background-color: rgba(11, 107, 58, 0.08); color: var(--eco-green); }
        .eco-pagination .page-item.active .page-link { background-color: var(--eco-green); border-color: var(--eco-green); color: #fff; }
        .eco-pagination .page-item.disabled .page-link { color: #adb5bd; background-color: #fff; }

        .eco-mes-acoes-wrap {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        /* Mantém os filtros em linha única no desktop */
        @media (min-width: 768px) {
            #filtrosExtrasMeses.collapse {
                display: contents !important;
                height: auto !important;
                visibility: visible !important;
            }
        }

        /* Ajustes Mobile (< 768px): Tabela vira lista de cards sem scroll horizontal */
        @media (max-width: 767.98px) {
            .eco-meses-topbar {
                flex-direction: column;
                align-items: stretch !important;
                gap: 10px;
            }
            .eco-meses-topbar .btn-novo-mes {
                width: 100%;
                padding-top: 9px;
                padding-bottom: 9px;
            }

            #cardTabelaMeses .table-responsive {
                overflow-x: visible;
            }
            #cardTabelaMeses table,
            #cardTabelaMeses tbody {
                display: block;
                width: 100%;
            }
            #cardTabelaMeses thead {
                display: none;
            }
            #cardTabelaMeses tr.eco-mes-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 10px 8px;
                padding: 14px;
                border-bottom: 1px solid #eef0f3;
                background: #fff;
            }
            #cardTabelaMeses tr.eco-mes-row:last-of-type {
                border-bottom: none;
            }
            #cardTabelaMeses tr.eco-mes-row td {
                display: block;
                border: none;
                padding: 0 !important;
            }
            #cardTabelaMeses td.eco-mes-titulo {
                font-size: 0.98rem;
                flex: 1 1 auto;
            }
            #cardTabelaMeses td.eco-mes-status {
                flex: 0 0 auto;
                text-align: right;
            }
            #cardTabelaMeses td.eco-mes-acoes {
                flex: 1 0 100%;
                text-align: left !important;
                padding-top: 4px !important;
            }
            #cardTabelaMeses .eco-mes-acoes-wrap {
                display: flex;
                width: 100%;
                gap: 8px;
            }
            #cardTabelaMeses .eco-btn-gerenciar {
                flex: 1 1 auto;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                min-height: 38px;
                font-weight: 600;
            }
            #cardTabelaMeses .eco-btn-icon {
                width: 38px;
                height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                font-size: 1rem;
            }
            #cardTabelaMeses tr.eco-empty-row,
            #cardTabelaMeses tr#emptyFilterRowMeses {
                display: block;
                width: 100%;
            }
            #cardTabelaMeses tr.eco-empty-row td,
            #cardTabelaMeses tr#emptyFilterRowMeses td {
                display: block;
                width: 100%;
                border: none;
            }

            /* Rodapé de paginação centralizado e confortável no toque */
            #footerPaginacaoMeses {
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
        }
    </style>

    <div class="eco-meses-topbar d-flex justify-content-between align-items-center mb-3">
        <p class="text-muted m-0 small">Gerencie o status de cada mês de produção.</p>
        <button class="btn btn-sm btn-eco fw-bold px-3 btn-novo-mes" data-bs-toggle="modal" data-bs-target="#modalNovoMes">
            <i class="ph ph-plus-circle me-1"></i> Criar Novo Mês
        </button>
    </div>

    <div id="cardTabelaMeses" class="card card-eco eco-loadable">
        <!-- Barra de Pesquisa e Filtro de Data -->
        <div class="card-header bg-white py-3 border-bottom">
            <div class="row g-2 align-items-end">
                <div class="col-12 col-md-12 col-lg-4">
                    <label for="buscaMeses" class="form-label small fw-semibold text-muted mb-1">Pesquisar</label>
                    <div class="d-flex gap-2">
                        <div class="input-group input-group-sm flex-grow-1">
                            <span class="input-group-text bg-light border-end-0 text-muted"><i class="ph ph-magnifying-glass"></i></span>
                            <input type="text" id="buscaMeses" class="form-control border-start-0" placeholder="Mês, ano ou status...">
                        </div>
                        <button type="button"
                                class="btn btn-sm btn-light border d-md-none d-inline-flex align-items-center gap-1 flex-shrink-0 px-2"
                                data-bs-toggle="collapse"
                                data-bs-target="#filtrosExtrasMeses"
                                aria-expanded="false"
                                aria-controls="filtrosExtrasMeses">
                            <i class="ph ph-funnel"></i>
                            <span class="small fw-semibold">Filtros</span>
                            <span id="badgeFiltrosMeses" class="badge bg-success rounded-pill d-none" style="font-size: 0.65rem;">0</span>
                        </button>
                    </div>
                </div>

                <!-- No mobile fica recolhido sob "Filtros"; no tablet/desktop fica visível na linha -->
                <div id="filtrosExtrasMeses" class="collapse col-12">
                    <div class="row g-2 align-items-end d-md-contents pt-2 pt-md-0">
                        <div class="col-6 col-md-4 col-lg-3">
                            <label for="dataDeMeses" class="form-label small fw-semibold text-muted mb-1">De:</label>
                            <input type="date" id="dataDeMeses" class="form-control form-control-sm">
                        </div>
                        <div class="col-6 col-md-4 col-lg-3">
                            <label for="dataParaMeses" class="form-label small fw-semibold text-muted mb-1">Para:</label>
                            <input type="date" id="dataParaMeses" class="form-control form-control-sm">
                        </div>
                        <div class="col-12 col-md-4 col-lg-2 d-flex gap-2">
                            <div class="flex-grow-1">
                                <label for="porPaginaMeses" class="form-label small fw-semibold text-muted mb-1">Exibir</label>
                                <select id="porPaginaMeses" class="form-select form-select-sm">
                                    <option value="10" selected>10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <div class="d-flex align-items-end">
                                <button type="button" id="btnLimparMeses" class="btn btn-sm btn-light border" style="min-height: 31px;" title="Limpar filtros">
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
                            <th class="ps-3">Mês / Ano</th>
                            <th>Status</th>
                            <th class="text-end pe-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyMeses">
                        ${mesesHtml}
                        <tr id="emptyFilterRowMeses" class="d-none">
                            <td colspan="3" class="text-center text-muted py-4">
                                <i class="ph ph-funnel-x me-1"></i> Nenhum mês encontrado para os filtros aplicados.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Rodapé com Paginação Inteligente -->
        <div id="footerPaginacaoMeses" class="card-footer bg-white py-2 px-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
            <small id="infoPaginacaoMeses" class="text-muted"></small>
            <nav aria-label="Paginação de meses">
                <ul id="paginacaoMeses" class="pagination pagination-sm eco-pagination m-0"></ul>
            </nav>
        </div>
    </div>

    <!-- Modal Novo Mês -->
    <div class="modal fade" id="modalNovoMes" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <form class="modal-content eco-loadable" action="/meses" method="POST" data-loading-text="Criando mês...">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold" style="color: var(--eco-green);">Abertura de Mês</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-2">
                        <label class="form-label small mb-1 fw-bold">Mês Referência</label>
                        <select name="nome" class="form-select form-select-sm" required>
                            ${opcoesMesesSelect}
                        </select>
                    </div>
                    <div class="mb-2">
                        <label class="form-label small mb-1 fw-bold">Ano</label>
                        <input type="number" name="ano" class="form-control form-control-sm" value="${new Date().getFullYear()}" required>
                    </div>
                </div>
                <div class="modal-footer border-0 pt-0">
                    <button type="submit" class="btn btn-sm btn-eco w-100 fw-bold py-2" data-loading-text="Criando...">Criar e Abrir Mês</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Editar Mês -->
    <div class="modal fade" id="modalEditarMes" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <form id="formEditarMes" class="modal-content eco-loadable" method="POST" data-loading-text="Salvando alterações..." data-loading-targets="#cardTabelaMeses">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold text-primary">
                        <i class="ph ph-pencil-simple me-1"></i> Editar Mês
                    </h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light mt-2">
                    <div class="mb-2">
                        <label class="form-label small mb-1 fw-bold">Mês Referência</label>
                        <select name="nome" id="editMesNome" class="form-select form-select-sm" required>
                            ${opcoesMesesSelect}
                        </select>
                    </div>
                    <div class="mb-2">
                        <label class="form-label small mb-1 fw-bold">Ano</label>
                        <input type="number" name="ano" id="editMesAno" class="form-control form-control-sm" required>
                    </div>
                    <div class="mb-1">
                        <label class="form-label small mb-1 fw-bold">Status do Ciclo</label>
                        <select name="status" id="editMesStatus" class="form-select form-select-sm" required>
                            <option value="aberto">Aberto (Permite novos registros)</option>
                            <option value="fechado">Fechado (Somente visualização)</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-sm btn-light border" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-primary fw-bold px-3" data-loading-text="Salvando...">Salvar Alterações</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Confirmar Exclusão de Mês -->
    <div class="modal fade" id="modalConfirmarExclusaoMes" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <form id="formExcluirMes" class="modal-content eco-loadable border-0 shadow" method="POST" data-loading-text="Excluindo mês..." data-loading-targets="#cardTabelaMeses">
                <div class="modal-body text-center p-4">
                    <div class="mb-2">
                        <i class="ph-fill ph-warning-circle text-danger" style="font-size: 2.8rem;"></i>
                    </div>
                    <h6 class="fw-bold text-dark mb-1">Excluir Mês?</h6>
                    <p class="small text-muted mb-2">
                        Você está prestes a excluir <strong id="excluirMesLabel" class="text-dark"></strong>.
                    </p>
                    <p class="small text-danger mb-0">
                        Esta ação não pode ser desfeita e não é permitida caso existam registros vinculados.
                    </p>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center gap-2 pb-3">
                    <button type="button" class="btn btn-sm btn-light border px-3" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-danger fw-bold px-3" data-loading-text="Excluindo...">Sim, Excluir</button>
                </div>
            </form>
        </div>
    </div>
    `;

    const pageScripts = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 1. Preenchimento do Modal de Edição de Mês
            var modalEditarMes = document.getElementById('modalEditarMes');
            if (modalEditarMes) {
                modalEditarMes.addEventListener('show.bs.modal', function(event) {
                    var btn = event.relatedTarget;
                    if (!btn) return;
                    var id = btn.getAttribute('data-id');
                    document.getElementById('formEditarMes').setAttribute('action', '/meses/editar/' + id);
                    document.getElementById('editMesNome').value = btn.getAttribute('data-nome') || 'Janeiro';
                    document.getElementById('editMesAno').value = btn.getAttribute('data-ano') || new Date().getFullYear();
                    document.getElementById('editMesStatus').value = btn.getAttribute('data-status') || 'aberto';
                });
            }

            // 2. Preenchimento do Modal de Confirmação de Exclusão de Mês
            var modalExcluirMes = document.getElementById('modalConfirmarExclusaoMes');
            if (modalExcluirMes) {
                modalExcluirMes.addEventListener('show.bs.modal', function(event) {
                    var btn = event.relatedTarget;
                    if (!btn) return;
                    var id = btn.getAttribute('data-id');
                    var label = btn.getAttribute('data-label') || 'este mês';
                    document.getElementById('formExcluirMes').setAttribute('action', '/meses/excluir/' + id);
                    document.getElementById('excluirMesLabel').textContent = label;
                });
            }

            // 3. Pesquisa, Filtro De:/Para: e Paginação Inteligente
            var rows = Array.from(document.querySelectorAll('#tbodyMeses .eco-mes-row'));
            var inputBusca = document.getElementById('buscaMeses');
            var inputDe = document.getElementById('dataDeMeses');
            var inputPara = document.getElementById('dataParaMeses');
            var selectPorPagina = document.getElementById('porPaginaMeses');
            var btnLimpar = document.getElementById('btnLimparMeses');
            var badgeFiltros = document.getElementById('badgeFiltrosMeses');
            var emptyRow = document.getElementById('emptyFilterRowMeses');
            var infoEl = document.getElementById('infoPaginacaoMeses');
            var paginacaoEl = document.getElementById('paginacaoMeses');
            var footerEl = document.getElementById('footerPaginacaoMeses');

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
                    var inicioMes = row.getAttribute('data-start') || '';
                    var fimMes = row.getAttribute('data-end') || '';

                    if (termo && texto.indexOf(termo) === -1) return false;
                    if (de || para) {
                        if (!inicioMes || !fimMes) return false;
                        if (de && fimMes < de) return false;
                        if (para && inicioMes > para) return false;
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
                    infoEl.textContent = 'Mostrando 0 de ' + rows.length + ' meses';
                } else {
                    var exibindoAte = Math.min(fimIdx, totalFiltrado);
                    var sufixoFiltro = totalFiltrado !== rows.length ? ' (filtrado de ' + rows.length + ')' : '';
                    infoEl.textContent = 'Mostrando ' + (inicioIdx + 1) + '–' + exibindoAte + ' de ' + totalFiltrado + ' meses' + sufixoFiltro;
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
    return renderLayout('Gestão de Meses', content, pageScripts, usuarioLogado, toastObj);
};