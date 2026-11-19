// Arquivo: views/ideias.js
const renderLayout = require('./layout');

function escapeAttr(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = function renderIdeias(ideias, mesesAbertos, usuarioLogado, msg = null, tipoMsg = 'success') {
    let ideiasHtml = '';
    let modaisHtml = ''; // Variável separada para guardar os modais fora da tabela
    
    if (ideias.length === 0) {
        ideiasHtml = '<tr class="eco-empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhuma ideia cadastrada ainda.</td></tr>';
    } else {
        ideias.forEach(ideia => {
            let badgeStatus = ideia.status === 'aprovada' ? 'bg-success' : (ideia.status === 'rejeitada' ? 'bg-danger' : 'bg-warning text-dark');
            let isAdmin = usuarioLogado.perfil === 'admin';
            let podeAvaliar = isAdmin && ideia.status === 'pendente';
            let podeExcluir = isAdmin || ideia.usuario_id === usuarioLogado.id;
            let temAcoes = podeAvaliar || podeExcluir;
            
            // 1. Gera a linha da tabela (que vira card no mobile)
            ideiasHtml += `
            <tr class="eco-ideia-row">
                <td class="ps-3 align-middle fw-bold text-dark eco-ideia-titulo">${ideia.titulo}</td>
                <td class="align-middle text-muted small eco-ideia-desc" title="${escapeAttr(ideia.descricao)}">${ideia.descricao}</td>
                <td class="align-middle eco-ideia-autor"><i class="ph ph-user me-1"></i>${ideia.autor}</td>
                <td class="align-middle eco-ideia-mes"><i class="ph ph-calendar-blank d-md-none me-1"></i>${ideia.mes_nome}/${ideia.mes_ano}</td>
                <td class="align-middle text-success fw-bold eco-ideia-bonus">
                    <span class="d-md-none text-muted fw-normal me-1">Bônus:</span>${ideia.status === 'aprovada' ? '+' + ideia.pontos_bonus + ' pts' : '-'}
                </td>
                <td class="align-middle eco-ideia-status"><span class="badge ${badgeStatus}">${ideia.status.toUpperCase()}</span></td>
                <td class="pe-3 align-middle text-end eco-ideia-acoes ${temAcoes ? '' : 'd-none d-md-table-cell'}">
                    ${temAcoes ? `
                    <div class="eco-ideia-acoes-wrap">
                        ${podeAvaliar ? `
                            <button type="button"
                                    class="btn btn-sm btn-light border text-primary eco-ideia-btn-main"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalAvaliar${ideia.id}"
                                    title="Avaliar">
                                <i class="ph ph-check-circle"></i> Avaliar
                            </button>
                        ` : ''}
                        
                        ${podeExcluir ? `
                            <button type="button"
                                    class="btn btn-sm btn-light border text-danger ${podeAvaliar ? 'eco-ideia-btn-icon' : 'eco-ideia-btn-main'}"
                                    title="Excluir"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalConfirmarExclusaoIdeia"
                                    data-id="${ideia.id}"
                                    data-label="${escapeAttr(ideia.titulo)}">
                                <i class="ph ph-trash"></i>
                                ${podeAvaliar ? '' : '<span class="d-md-none ms-1">Excluir Ideia</span>'}
                            </button>
                        ` : ''}
                    </div>
                    ` : ''}
                </td>
            </tr>
            `;
            
            // 2. Gera os modais separadamente (apenas se for admin e estiver pendente)
            if (podeAvaliar) {
                modaisHtml += `
                <div class="modal fade" id="modalAvaliar${ideia.id}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-sm">
                        <form class="modal-content eco-loadable" action="/ideias/${ideia.id}/avaliar" method="POST" data-loading-text="Salvando avaliação..." data-loading-targets="#cardTabelaIdeias">
                            <div class="modal-header border-0 pb-0">
                                <h6 class="modal-title fw-bold text-primary">
                                    <i class="ph ph-check-circle me-1"></i> Avaliar Ideia
                                </h6>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body bg-light mt-2 pt-3">
                                <p class="small text-muted mb-3"><strong>Ideia:</strong> ${ideia.titulo}</p>
                                <div class="mb-2">
                                    <label class="form-label small fw-bold">Decisão</label>
                                    <select name="status" class="form-select form-select-sm" required>
                                        <option value="aprovada">Aprovar (Gera Pontos)</option>
                                        <option value="rejeitada">Rejeitar</option>
                                    </select>
                                </div>
                                <div class="mb-1">
                                    <label class="form-label small fw-bold">Pontos Bônus</label>
                                    <input type="number" name="pontos_bonus" class="form-control form-control-sm" value="0" min="0">
                                    <div class="form-text" style="font-size: 0.72rem;">Estes pontos serão somados ao mês da ideia.</div>
                                </div>
                            </div>
                            <div class="modal-footer border-0">
                                <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold py-2" data-loading-text="Confirmando...">Confirmar Avaliação</button>
                            </div>
                        </form>
                    </div>
                </div>
                `;
            }
        });
    }

    const content = `
    <style>
        .eco-ideia-desc {
            max-width: 220px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .eco-ideia-acoes-wrap {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        /* =========================================================
           ADAPTAÇÕES MOBILE (< 768px)
        ========================================================= */
        @media (max-width: 767.98px) {
            .eco-ideias-topbar {
                flex-direction: column;
                align-items: stretch !important;
                gap: 10px;
            }
            .eco-ideias-topbar .btn-nova-ideia {
                width: 100%;
                min-height: 40px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .eco-ideias-topbar .badge {
                padding: 8px 12px;
                font-size: 0.78rem;
            }

            /* Tabela vira lista de cards sem scroll horizontal */
            #cardTabelaIdeias .table-responsive {
                overflow-x: visible;
            }
            #cardTabelaIdeias table,
            #cardTabelaIdeias tbody {
                display: block;
                width: 100%;
            }
            #cardTabelaIdeias thead {
                display: none;
            }
            #cardTabelaIdeias tr.eco-ideia-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 6px 10px;
                padding: 14px;
                border-bottom: 1px solid #eef0f3;
                background: #fff;
            }
            #cardTabelaIdeias tr.eco-ideia-row:last-of-type {
                border-bottom: none;
            }
            #cardTabelaIdeias tr.eco-ideia-row td {
                display: block;
                border: none;
                padding: 0 !important;
            }
            #cardTabelaIdeias td.eco-ideia-titulo {
                grid-column: 1;
                grid-row: 1;
                font-size: 0.95rem;
                line-height: 1.3;
                word-break: break-word;
            }
            #cardTabelaIdeias td.eco-ideia-status {
                grid-column: 2;
                grid-row: 1;
                justify-self: end;
                align-self: start;
            }
            #cardTabelaIdeias td.eco-ideia-desc {
                grid-column: 1 / -1;
                grid-row: 2;
                max-width: none;
                white-space: normal;
                overflow: visible;
                text-overflow: clip;
                background: #f8f9fa;
                border: 1px solid #edf0f2 !important;
                border-radius: 6px;
                padding: 8px 10px !important;
                margin: 2px 0;
                font-size: 0.82rem;
                line-height: 1.45;
                color: #495057 !important;
                word-break: break-word;
            }
            #cardTabelaIdeias td.eco-ideia-autor {
                grid-column: 1;
                grid-row: 3;
                font-size: 0.8rem;
                color: #6c757d;
                align-self: center;
            }
            #cardTabelaIdeias td.eco-ideia-mes {
                grid-column: 2;
                grid-row: 3;
                justify-self: end;
                font-size: 0.8rem;
                color: #6c757d;
                align-self: center;
            }
            #cardTabelaIdeias td.eco-ideia-bonus {
                grid-column: 1 / -1;
                grid-row: 4;
                font-size: 0.84rem;
            }
            #cardTabelaIdeias td.eco-ideia-acoes {
                grid-column: 1 / -1;
                grid-row: 5;
                text-align: left !important;
                margin-top: 4px;
            }
            #cardTabelaIdeias .eco-ideia-acoes-wrap {
                display: flex;
                width: 100%;
                gap: 8px;
            }
            #cardTabelaIdeias .eco-ideia-btn-main {
                flex: 1 1 auto;
                min-height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-weight: 600;
            }
            #cardTabelaIdeias .eco-ideia-btn-icon {
                width: 38px;
                height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                font-size: 1rem;
            }
            #cardTabelaIdeias tr.eco-empty-row,
            #cardTabelaIdeias tr.eco-empty-row td {
                display: block;
                width: 100%;
                border: none;
            }
            #modalNovaIdeia .modal-footer .btn {
                width: 100%;
                min-height: 40px;
            }
        }
    </style>

    <div class="eco-ideias-topbar d-flex justify-content-between align-items-center mb-3">
        <p class="text-muted m-0 small">Cadastre melhorias. Ideias aprovadas rendem pontos extras no mês.</p>
        ${mesesAbertos.length > 0 ? `
            <button class="btn btn-sm btn-eco fw-bold px-3 btn-nova-ideia" data-bs-toggle="modal" data-bs-target="#modalNovaIdeia">
                <i class="ph ph-lightbulb"></i> Sugerir Nova Ideia
            </button>
        ` : `<span class="badge bg-secondary">Abra um mês para sugerir ideias</span>`}
    </div>

    <div id="cardTabelaIdeias" class="card card-eco eco-loadable mb-4">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover table-sm m-0" style="font-size: 0.85rem;">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-3">Título</th>
                            <th>Descrição</th>
                            <th>Autor</th>
                            <th>Mês Referência</th>
                            <th>Bônus</th>
                            <th>Status</th>
                            <th class="text-end pe-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ideiasHtml}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal Nova Ideia (Renderizado fora da tabela) -->
    <div class="modal fade" id="modalNovaIdeia" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form class="modal-content eco-loadable" action="/ideias" method="POST" data-loading-text="Enviando ideia..." data-loading-targets="#cardTabelaIdeias">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold" style="color: var(--eco-green);">
                        <i class="ph ph-lightbulb me-1"></i> Sugerir Nova Ideia
                    </h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light pt-3 mt-2">
                    <div class="mb-2">
                        <label class="form-label small fw-bold">Vincular a qual Mês Aberto?</label>
                        <select name="mes_id" class="form-select form-select-sm" required>
                            ${mesesAbertos.map(m => `<option value="${m.id}">${m.nome} / ${m.ano}</option>`).join('')}
                        </select>
                    </div>
                    <div class="mb-2">
                        <label class="form-label small fw-bold">Título da Ideia</label>
                        <input type="text" name="titulo" class="form-control form-control-sm" placeholder="Ex: Padronização de Cores dos Posts" required>
                    </div>
                    <div class="mb-1">
                        <label class="form-label small fw-bold">Descrição Completa</label>
                        <textarea name="descricao" class="form-control form-control-sm" rows="3" placeholder="Explique como isso ajudará o setor..." required></textarea>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="submit" class="btn btn-sm btn-eco fw-bold px-4" data-loading-text="Enviando...">Enviar Ideia</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Confirmar Exclusão de Ideia -->
    <div class="modal fade" id="modalConfirmarExclusaoIdeia" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <form id="formExcluirIdeia" class="modal-content eco-loadable border-0 shadow" method="POST" data-loading-text="Excluindo ideia..." data-loading-targets="#cardTabelaIdeias">
                <div class="modal-body text-center p-4">
                    <div class="mb-2">
                        <i class="ph-fill ph-warning-circle text-danger" style="font-size: 2.8rem;"></i>
                    </div>
                    <h6 class="fw-bold text-dark mb-1">Excluir Ideia?</h6>
                    <p class="small text-muted mb-2">
                        Deseja realmente remover <strong id="excluirIdeiaLabel" class="text-dark"></strong>?
                    </p>
                    <p class="small text-muted mb-0">
                        Caso a ideia já tenha sido aprovada, os pontos bônus deixarão de somar no mês vinculado.
                    </p>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center gap-2 pb-3">
                    <button type="button" class="btn btn-sm btn-light border px-3" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-danger fw-bold px-3" data-loading-text="Excluindo...">Sim, Excluir</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modais de Avaliação Dinâmicos (Renderizados fora da tabela) -->
    ${modaisHtml}
    `;

    const pageScripts = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var modalExcluirIdeia = document.getElementById('modalConfirmarExclusaoIdeia');
            if (modalExcluirIdeia) {
                modalExcluirIdeia.addEventListener('show.bs.modal', function(event) {
                    var btn = event.relatedTarget;
                    if (!btn) return;
                    var id = btn.getAttribute('data-id');
                    var label = btn.getAttribute('data-label') || 'esta ideia';
                    document.getElementById('formExcluirIdeia').setAttribute('action', '/ideias/' + id + '/excluir');
                    document.getElementById('excluirIdeiaLabel').textContent = label;
                });
            }
        });
    </script>
    `;

    const toastObj = msg ? { msg, tipo: tipoMsg } : null;
    return renderLayout('Banco de Ideias', content, pageScripts, usuarioLogado, toastObj);
};