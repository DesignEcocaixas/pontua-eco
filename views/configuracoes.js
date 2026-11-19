// Arquivo: views/configuracoes.js
const renderLayout = require('./layout');

function escapeAttr(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = function renderConfiguracoes(usuarioLogado, usuarios = [], bonificacoes = [], msg = null, tipoMsg = 'success') {
    const isAdmin = usuarioLogado.perfil === 'admin';
    const formatFoto = (foto) => foto ? (foto.startsWith('/') ? foto : '/' + foto) : null;

    // ---------------------------------------------
    // TABELA DE USUÁRIOS E MODAIS DE EDIÇÃO (SÓ ADMIN)
    // ---------------------------------------------
    let usuariosHtml = '';
    let modaisEdicaoHtml = '';
    
    if (isAdmin) {
        if (usuarios.length === 0) {
            usuariosHtml = '<tr class="eco-empty-row"><td colspan="4" class="text-center text-muted py-4">Nenhum usuário cadastrado.</td></tr>';
        } else {
            usuarios.forEach(u => {
                let badgePerfil = u.perfil === 'admin' ? 'bg-danger' : 'bg-primary';
                let fotoUsu = formatFoto(u.foto);

                usuariosHtml += `
                <tr class="eco-cfg-user-row">
                    <td class="ps-3 align-middle fw-bold text-dark eco-cfg-user-nome">
                        <div class="d-flex align-items-center gap-2 min-w-0">
                            ${fotoUsu
                                ? `<img src="${fotoUsu}" class="rounded-circle flex-shrink-0" style="width: 28px; height: 28px; object-fit: cover;">`
                                : `<i class="ph-fill ph-user-circle text-muted flex-shrink-0" style="font-size: 28px; line-height: 1;"></i>`}
                            <span class="text-truncate">${u.nome}</span>
                        </div>
                    </td>
                    <td class="align-middle text-muted eco-cfg-user-email">
                        <i class="ph ph-envelope-simple d-md-none me-1"></i>${u.email}
                    </td>
                    <td class="align-middle eco-cfg-user-perfil">
                        <span class="badge ${badgePerfil}">${u.perfil.toUpperCase()}</span>
                    </td>
                    <td class="pe-3 align-middle text-end eco-cfg-acoes">
                        <div class="eco-cfg-acoes-wrap">
                            <button type="button"
                                    class="btn btn-sm btn-light border text-primary eco-cfg-btn-main"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalEditarUsu${u.id}"
                                    title="Editar">
                                <i class="ph ph-pencil-simple"></i>
                                <span class="d-md-none ms-1">Editar</span>
                            </button>
                            <button type="button"
                                    class="btn btn-sm btn-light border text-danger eco-cfg-btn-icon"
                                    title="Excluir"
                                    data-bs-toggle="modal"
                                    data-bs-target="#modalConfirmarExclusaoConfig"
                                    data-action="/configuracoes/usuarios/${u.id}/excluir"
                                    data-target-pane="#usuarios-pane"
                                    data-loading="Excluindo usuário..."
                                    data-title="Excluir Usuário?"
                                    data-label="${escapeAttr(u.nome)}"
                                    data-desc="Esta ação removerá o acesso deste usuário ao sistema.">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;

                modaisEdicaoHtml += `
                <div class="modal fade" id="modalEditarUsu${u.id}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-sm">
                        <form class="modal-content eco-loadable" action="/configuracoes/usuarios/${u.id}/editar" method="POST" data-loading-text="Salvando alterações..." data-loading-targets="#usuarios-pane">
                            <div class="modal-header border-0 pb-0">
                                <h6 class="modal-title fw-bold text-primary">
                                    <i class="ph ph-pencil-simple me-1"></i> Editar Usuário
                                </h6>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body bg-light pt-3 mt-2">
                                <div class="mb-2">
                                    <label class="form-label small fw-bold">Nome</label>
                                    <input type="text" name="nome" class="form-control form-control-sm" value="${escapeAttr(u.nome)}" required>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small fw-bold">E-mail</label>
                                    <input type="email" name="email" class="form-control form-control-sm" value="${escapeAttr(u.email)}" required>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small fw-bold">Nova Senha <span class="text-muted fw-normal">(Opcional)</span></label>
                                    <div class="input-group input-group-sm">
                                        <input type="password" name="senha" class="form-control" placeholder="Deixe em branco para manter" id="senhaEdit${u.id}">
                                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="senhaEdit${u.id}" aria-label="Mostrar senha">
                                            <i class="ph ph-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-1">
                                    <label class="form-label small fw-bold">Perfil</label>
                                    <select name="perfil" class="form-select form-select-sm">
                                        <option value="usuario" ${u.perfil === 'usuario' ? 'selected' : ''}>Usuário Comum</option>
                                        <option value="admin" ${u.perfil === 'admin' ? 'selected' : ''}>Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer border-0">
                                <button type="submit" class="btn btn-sm btn-primary w-100 fw-bold py-2" data-loading-text="Salvando...">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>`;
            });
        }
    }

    // ---------------------------------------------
    // TABELA DE BONIFICAÇÕES
    // ---------------------------------------------
    let bonificacoesHtml = '';
    if (bonificacoes.length === 0) {
        bonificacoesHtml = '<tr class="eco-empty-row"><td colspan="3" class="text-center text-muted py-4">Nenhuma faixa cadastrada.</td></tr>';
    } else {
        bonificacoes.forEach(b => {
            const faixaTexto = `De ${b.pontos_min} a ${b.pontos_max === 9999 ? 'Infinito' : b.pontos_max} pts`;
            const valorTexto = `R$ ${parseFloat(b.valor).toFixed(2).replace('.', ',')}`;

            bonificacoesHtml += `
            <tr class="eco-cfg-bonus-row">
                <td class="ps-3 align-middle fw-bold text-dark eco-cfg-bonus-faixa">${faixaTexto}</td>
                <td class="align-middle text-success fw-bold eco-cfg-bonus-valor">${valorTexto}</td>
                <td class="pe-3 align-middle text-end eco-cfg-acoes">
                    <div class="eco-cfg-acoes-wrap">
                        <button type="button"
                                class="btn btn-sm btn-light border text-danger eco-cfg-btn-excluir-bonus"
                                title="Excluir"
                                data-bs-toggle="modal"
                                data-bs-target="#modalConfirmarExclusaoConfig"
                                data-action="/configuracoes/bonificacoes/${b.id}/excluir"
                                data-target-pane="#bonus-pane"
                                data-loading="Excluindo faixa..."
                                data-title="Excluir Faixa de Bônus?"
                                data-label="${escapeAttr(`${faixaTexto} (${valorTexto})`)}"
                                data-desc="O cálculo das premiações futuras passará a considerar apenas as faixas restantes.">
                            <i class="ph ph-trash"></i>
                            <span class="d-md-none ms-1">Excluir Faixa</span>
                        </button>
                    </div>
                </td>
            </tr>`;
        });
    }

    const fotoLogado = formatFoto(usuarioLogado.foto);

    const content = `
    <style>
        /* Corrige herança do estilo da sidebar nas abas de Configurações */
        #configTabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 4px;
        }
        #configTabs::-webkit-scrollbar { display: none; }
        #configTabs .nav-link {
            white-space: nowrap;
            border: none;
            border-bottom: 2px solid transparent;
            border-right: none !important;
            background: transparent;
            color: #6c757d;
            padding: 10px 14px;
            gap: 8px;
        }
        #configTabs .nav-link:hover {
            color: var(--eco-green);
            background-color: rgba(11, 107, 58, 0.05);
        }
        #configTabs .nav-link.active {
            color: var(--eco-green) !important;
            border-bottom: 2px solid var(--eco-green);
            background-color: rgba(11, 107, 58, 0.06);
        }

        .eco-cfg-acoes-wrap {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .toggle-password {
            min-width: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        /* =========================================================
           ADAPTAÇÕES MOBILE (< 768px)
        ========================================================= */
        @media (max-width: 767.98px) {
            #perfil-pane {
                padding: 1rem !important;
            }
            .eco-perfil-foto-wrap {
                flex-direction: column;
                align-items: center !important;
                text-align: center;
                gap: 12px !important;
            }
            .eco-perfil-foto-input {
                width: 100%;
                text-align: left;
            }
            .eco-btn-salvar-perfil {
                width: 100%;
                min-height: 42px;
            }

            /* Barra de ação das abas Admin */
            .eco-cfg-tab-bar {
                flex-direction: column;
                align-items: stretch !important;
                gap: 10px;
            }
            .eco-cfg-tab-bar .btn {
                width: 100%;
                min-height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            /* Tabelas de Usuários e Bonificações viram cards sem scroll horizontal */
            #usuarios-pane .table-responsive,
            #bonus-pane .table-responsive {
                overflow-x: visible;
            }
            #usuarios-pane table, #usuarios-pane tbody,
            #bonus-pane table, #bonus-pane tbody {
                display: block;
                width: 100%;
            }
            #usuarios-pane thead,
            #bonus-pane thead {
                display: none;
            }

            /* Card de Usuário */
            tr.eco-cfg-user-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 8px 10px;
                padding: 14px;
                border-bottom: 1px solid #eef0f3;
                background: #fff;
            }
            tr.eco-cfg-user-row:last-of-type { border-bottom: none; }
            tr.eco-cfg-user-row td {
                display: block;
                border: none;
                padding: 0 !important;
            }
            td.eco-cfg-user-nome {
                grid-column: 1;
                grid-row: 1;
                min-width: 0;
                font-size: 0.95rem;
            }
            td.eco-cfg-user-perfil {
                grid-column: 2;
                grid-row: 1;
                justify-self: end;
                align-self: center;
            }
            td.eco-cfg-user-email {
                grid-column: 1 / -1;
                grid-row: 2;
                font-size: 0.82rem;
                word-break: break-word;
            }
            tr.eco-cfg-user-row td.eco-cfg-acoes {
                grid-column: 1 / -1;
                grid-row: 3;
                text-align: left !important;
                margin-top: 2px;
            }

            /* Card de Faixa de Bonificação */
            tr.eco-cfg-bonus-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 10px;
                padding: 14px;
                border-bottom: 1px solid #eef0f3;
                background: #fff;
                align-items: center;
            }
            tr.eco-cfg-bonus-row:last-of-type { border-bottom: none; }
            tr.eco-cfg-bonus-row td {
                display: block;
                border: none;
                padding: 0 !important;
            }
            td.eco-cfg-bonus-faixa {
                grid-column: 1;
                grid-row: 1;
                font-size: 0.92rem;
            }
            td.eco-cfg-bonus-valor {
                grid-column: 2;
                grid-row: 1;
                justify-self: end;
                font-size: 1rem;
                white-space: nowrap;
            }
            tr.eco-cfg-bonus-row td.eco-cfg-acoes {
                grid-column: 1 / -1;
                grid-row: 2;
                text-align: left !important;
            }

            /* Botões de ação com área de toque confortável */
            .eco-cfg-acoes-wrap {
                display: flex;
                width: 100%;
                gap: 8px;
            }
            .eco-cfg-btn-main,
            .eco-cfg-btn-excluir-bonus {
                flex: 1 1 auto;
                min-height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            }
            .eco-cfg-btn-icon {
                width: 38px;
                height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                font-size: 1rem;
            }

            tr.eco-empty-row,
            tr.eco-empty-row td {
                display: block;
                width: 100%;
                border: none;
            }
        }
    </style>

    <div class="d-flex justify-content-between align-items-center mb-3 mb-md-4">
        <div>
            <h5 class="m-0 fw-bold text-dark">Configurações</h5>
            <p class="text-muted m-0 small">Gerencie seu perfil e os dados do sistema.</p>
        </div>
    </div>

    <div class="card card-eco border-0 overflow-hidden">
        <div class="card-header bg-white border-bottom pt-2 pb-0 px-2 px-md-3">
            <ul class="nav nav-tabs border-0" id="configTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active fw-bold" id="perfil-tab" data-bs-toggle="tab" data-bs-target="#perfil-pane" type="button" role="tab">
                        <i class="ph ph-user-circle"></i> Meu Perfil
                    </button>
                </li>
                ${isAdmin ? `
                <li class="nav-item" role="presentation">
                    <button class="nav-link fw-bold" id="usuarios-tab" data-bs-toggle="tab" data-bs-target="#usuarios-pane" type="button" role="tab">
                        <i class="ph ph-users"></i> Equipe e Acessos
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link fw-bold" id="bonus-tab" data-bs-toggle="tab" data-bs-target="#bonus-pane" type="button" role="tab">
                        <i class="ph ph-currency-dollar"></i> Faixas de Bonificação
                    </button>
                </li>` : ''}
            </ul>
        </div>
        <div class="card-body p-0">
            <div class="tab-content" id="configTabsContent">
                
                <!-- ABA MEU PERFIL -->
                <div class="tab-pane fade show active p-4 eco-loadable" id="perfil-pane" role="tabpanel">
                    <form action="/configuracoes/perfil" method="POST" enctype="multipart/form-data" class="row g-3" style="max-width: 600px;" data-loading-targets="#perfil-pane" data-loading-text="Salvando perfil...">
                        <div class="col-12 d-flex align-items-center gap-3 mb-2 eco-perfil-foto-wrap">
                            ${fotoLogado
                                ? `<img src="${fotoLogado}" class="rounded-circle shadow-sm flex-shrink-0" style="width: 80px; height: 80px; object-fit: cover; border: 3px solid var(--eco-green);">`
                                : `<i class="ph-fill ph-user-circle text-muted flex-shrink-0" style="font-size: 80px; line-height: 1;"></i>`}
                            <div class="eco-perfil-foto-input flex-grow-1">
                                <label class="form-label small fw-bold mb-1">Foto de Perfil</label>
                                <input type="file" name="foto" class="form-control form-control-sm" accept="image/jpeg, image/png, image/webp">
                                <div class="form-text" style="font-size: 0.75rem;">Imagens JPG ou PNG. Recomendado: formato quadrado.</div>
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label small fw-bold">Nome Completo</label>
                            <input type="text" name="nome" class="form-control" value="${escapeAttr(usuarioLogado.nome)}" required>
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label small fw-bold">E-mail</label>
                            <input type="email" name="email" class="form-control" value="${escapeAttr(usuarioLogado.email)}" required>
                        </div>
                        
                        <!-- CAMPO DE SENHA COM OLHO (MEU PERFIL) -->
                        <div class="col-12 col-md-6">
                            <label class="form-label small fw-bold">Atualizar Senha</label>
                            <div class="input-group">
                                <input type="password" name="senha" class="form-control" placeholder="Digite apenas para trocar" id="senhaPerfil">
                                <button class="btn btn-outline-secondary toggle-password" type="button" data-target="senhaPerfil" aria-label="Mostrar senha">
                                    <i class="ph ph-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="col-12 mt-4">
                            <button type="submit" class="btn btn-eco fw-bold px-4 eco-btn-salvar-perfil" data-loading-text="Salvando...">Salvar Meu Perfil</button>
                        </div>
                    </form>
                </div>

                ${isAdmin ? `
                <!-- ABA EQUIPE E ACESSOS -->
                <div class="tab-pane fade eco-loadable" id="usuarios-pane" role="tabpanel">
                    <div class="p-3 bg-light border-bottom d-flex justify-content-end eco-cfg-tab-bar">
                        <button class="btn btn-sm btn-eco fw-bold" data-bs-toggle="modal" data-bs-target="#modalNovoUsuario">
                            <i class="ph ph-user-plus"></i> Cadastrar Usuário
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover table-sm m-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2">Nome Completo</th>
                                    <th class="py-2">E-mail de Acesso</th>
                                    <th class="py-2">Perfil</th>
                                    <th class="text-end pe-3 py-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>${usuariosHtml}</tbody>
                        </table>
                    </div>
                </div>

                <!-- ABA FAIXAS DE BONIFICAÇÃO -->
                <div class="tab-pane fade eco-loadable" id="bonus-pane" role="tabpanel">
                    <div class="p-3 bg-light border-bottom d-flex justify-content-between align-items-center eco-cfg-tab-bar">
                        <span class="small text-muted">Defina as faixas de premiação financeira baseada nos pontos consolidados.</span>
                        <button class="btn btn-sm btn-eco fw-bold flex-shrink-0" data-bs-toggle="modal" data-bs-target="#modalNovaFaixa">
                            <i class="ph ph-plus-circle"></i> Adicionar Faixa
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover table-sm m-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3 py-2">Intervalo de Pontuação (SLA)</th>
                                    <th class="py-2">Prêmio Financeiro (R$)</th>
                                    <th class="text-end pe-3 py-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>${bonificacoesHtml}</tbody>
                        </table>
                    </div>
                </div>` : ''}
            </div>
        </div>
    </div>

    <!-- Modais Inserção e Confirmação (Admin) -->
    ${isAdmin ? `
    <div class="modal fade" id="modalNovoUsuario" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-sm">
            <form class="modal-content eco-loadable" action="/configuracoes/usuarios" method="POST" data-loading-text="Cadastrando usuário..." data-loading-targets="#usuarios-pane">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold" style="color: var(--eco-green);">Novo Usuário</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light pt-3 mt-2">
                    <div class="mb-2">
                        <label class="form-label small fw-bold">Nome</label>
                        <input type="text" name="nome" class="form-control form-control-sm" required>
                    </div>
                    <div class="mb-2">
                        <label class="form-label small fw-bold">E-mail</label>
                        <input type="email" name="email" class="form-control form-control-sm" required>
                    </div>
                    
                    <!-- CAMPO DE SENHA COM OLHO (NOVO USUÁRIO) -->
                    <div class="mb-2">
                        <label class="form-label small fw-bold">Senha Inicial</label>
                        <div class="input-group input-group-sm">
                            <input type="password" name="senha" class="form-control" required id="senhaNovoUsu">
                            <button class="btn btn-outline-secondary toggle-password" type="button" data-target="senhaNovoUsu" aria-label="Mostrar senha">
                                <i class="ph ph-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-1">
                        <label class="form-label small fw-bold">Perfil de Acesso</label>
                        <select name="perfil" class="form-select form-select-sm" required>
                            <option value="usuario">Usuário Comum</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="submit" class="btn btn-sm btn-eco w-100 fw-bold py-2" data-loading-text="Salvando...">Salvar Usuário</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Nova Faixa de Bonificação -->
    <div class="modal fade" id="modalNovaFaixa" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-sm">
            <form class="modal-content eco-loadable" action="/configuracoes/bonificacoes" method="POST" data-loading-text="Adicionando faixa..." data-loading-targets="#bonus-pane">
                <div class="modal-header border-0 pb-0">
                    <h6 class="modal-title fw-bold" style="color: var(--eco-green);">Nova Faixa Financeira</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light pt-3 mt-2">
                    <div class="row g-2">
                        <div class="col-6 mb-2">
                            <label class="form-label small fw-bold">Mínimo (Pts)</label>
                            <input type="number" name="pontos_min" class="form-control form-control-sm" required>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small fw-bold">Máximo (Pts)</label>
                            <input type="number" name="pontos_max" class="form-control form-control-sm" placeholder="Ex: 9999" required>
                        </div>
                    </div>
                    <div class="mb-1">
                        <label class="form-label small fw-bold">Valor do Prêmio (R$)</label>
                        <input type="number" step="0.01" name="valor" class="form-control form-control-sm" placeholder="Ex: 250.00" required>
                    </div>
                </div>
                <div class="modal-footer border-0">
                    <button type="submit" class="btn btn-sm btn-eco w-100 fw-bold py-2" data-loading-text="Adicionando...">Adicionar Faixa</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Confirmar Exclusão (Usuários e Faixas) -->
    <div class="modal fade" id="modalConfirmarExclusaoConfig" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <form id="formExcluirConfig" class="modal-content eco-loadable border-0 shadow" method="POST" data-loading-text="Excluindo...">
                <div class="modal-body text-center p-4">
                    <div class="mb-2">
                        <i class="ph-fill ph-warning-circle text-danger" style="font-size: 2.8rem;"></i>
                    </div>
                    <h6 id="excluirConfigTitulo" class="fw-bold text-dark mb-1">Confirmar Exclusão?</h6>
                    <p class="small text-muted mb-2">
                        Deseja realmente excluir <strong id="excluirConfigLabel" class="text-dark"></strong>?
                    </p>
                    <p id="excluirConfigDesc" class="small text-muted mb-0"></p>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center gap-2 pb-3">
                    <button type="button" class="btn btn-sm btn-light border px-3" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-danger fw-bold px-3" data-loading-text="Excluindo...">Sim, Excluir</button>
                </div>
            </form>
        </div>
    </div>
    
    ${modaisEdicaoHtml}
    ` : ''}
    `;

    const pageScripts = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 1. Toggle de visualização de senha
            document.querySelectorAll('.toggle-password').forEach(function(button) {
                button.addEventListener('click', function() {
                    var targetId = this.getAttribute('data-target');
                    var passwordInput = document.getElementById(targetId);
                    var icon = this.querySelector('i');
                    if (!passwordInput) return;

                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        icon.classList.remove('ph-eye');
                        icon.classList.add('ph-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        icon.classList.remove('ph-eye-slash');
                        icon.classList.add('ph-eye');
                    }
                });
            });

            // 2. Preenchimento dinâmico do Modal de Confirmação de Exclusão
            var modalExcluir = document.getElementById('modalConfirmarExclusaoConfig');
            if (modalExcluir) {
                modalExcluir.addEventListener('show.bs.modal', function(event) {
                    var btn = event.relatedTarget;
                    if (!btn) return;

                    var form = document.getElementById('formExcluirConfig');
                    form.setAttribute('action', btn.getAttribute('data-action') || '');
                    form.setAttribute('data-loading-targets', btn.getAttribute('data-target-pane') || '');
                    form.setAttribute('data-loading-text', btn.getAttribute('data-loading') || 'Excluindo...');

                    document.getElementById('excluirConfigTitulo').textContent = btn.getAttribute('data-title') || 'Confirmar Exclusão?';
                    document.getElementById('excluirConfigLabel').textContent = btn.getAttribute('data-label') || 'este item';
                    document.getElementById('excluirConfigDesc').textContent = btn.getAttribute('data-desc') || '';
                });
            }
        });
    </script>
    `;

    const toastObj = msg ? { msg, tipo: tipoMsg } : null;
    return renderLayout('Configurações', content, pageScripts, usuarioLogado, toastObj);
};