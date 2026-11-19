// Arquivo: views/relatorios.js
const renderLayout = require('./layout');

const MAPA_MESES = {
    janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
};

function obterChaveMes(mes) {
    const nomeNorm = String(mes.nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    const numMes = MAPA_MESES[nomeNorm] || 0;
    const ano = parseInt(mes.ano, 10) || 0;
    return (ano * 100) + numMes;
}

module.exports = function renderRelatorios(meses, msg = null, tipoMsg = 'success', usuarioLogado = null) {
    let mesesHtml = '';

    // Lista em ordem cronológica crescente para os selects de intervalo (De -> Até)
    const mesesCronologicos = [...meses].sort((a, b) => obterChaveMes(a) - obterChaveMes(b));
    const primeiroMesId = mesesCronologicos.length > 0 ? mesesCronologicos[0].id : null;
    const ultimoMesId = mesesCronologicos.length > 0 ? mesesCronologicos[mesesCronologicos.length - 1].id : null;

    const opcoesDeHtml = mesesCronologicos.map(m => `
        <option value="${m.id}" data-chave="${obterChaveMes(m)}" ${m.id === primeiroMesId ? 'selected' : ''}>
            ${m.nome} / ${m.ano}
        </option>
    `).join('');

    const opcoesAteHtml = mesesCronologicos.map(m => `
        <option value="${m.id}" data-chave="${obterChaveMes(m)}" ${m.id === ultimoMesId ? 'selected' : ''}>
            ${m.nome} / ${m.ano}
        </option>
    `).join('');
    
    if (meses.length === 0) {
        mesesHtml = '<tr class="eco-empty-row"><td colspan="4" class="text-center text-muted py-4">Nenhum mês cadastrado para gerar relatório.</td></tr>';
    } else {
        meses.forEach(mes => {
            const badgeClass = mes.status === 'aberto' ? 'bg-success' : 'bg-secondary';
            mesesHtml += `
            <tr class="eco-rel-row">
                <td class="ps-3 align-middle fw-bold text-dark eco-rel-mes">${mes.nome} / ${mes.ano}</td>
                <td class="align-middle eco-rel-status"><span class="badge ${badgeClass}">${mes.status.toUpperCase()}</span></td>
                <td class="align-middle text-muted small eco-rel-desc">Relatório Consolidado de Produtividade e SLA</td>
                <td class="pe-3 align-middle text-end eco-rel-acao">
                    <a href="/relatorios/exportar/${mes.id}" class="btn btn-sm btn-eco fw-bold shadow-sm btn-exportar-xlsx eco-rel-btn" data-mes="${mes.nome}/${mes.ano}" title="Baixar Excel">
                        <i class="ph-bold ph-download-simple"></i> Baixar .XLSX
                    </a>
                </td>
            </tr>`;
        });
    }

    const cardIntervaloHtml = mesesCronologicos.length > 0 ? `
    <div id="cardRelatorioIntervalo" class="card card-eco eco-loadable border-0 mb-4">
        <div class="card-body p-3 p-md-4">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <div>
                    <h6 class="fw-bold text-dark mb-1">
                        <i class="ph-fill ph-files text-success me-1"></i> Relatório Completo por Intervalo
                    </h6>
                    <p class="text-muted small m-0">
                        Exporte vários meses em um único Excel: uma aba de <strong>Resumo Geral</strong> + <strong>uma aba dedicada para cada mês</strong> do período.
                    </p>
                </div>
                <span id="badgeResumoIntervalo" class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"></span>
            </div>

            <form id="formExportarIntervalo" class="row g-2 align-items-end">
                <div class="col-6 col-md-4">
                    <label for="selectMesDe" class="form-label small fw-semibold text-muted mb-1">De (Mês Inicial)</label>
                    <select id="selectMesDe" name="de" class="form-select form-select-sm" required>
                        ${opcoesDeHtml}
                    </select>
                </div>
                <div class="col-6 col-md-4">
                    <label for="selectMesAte" class="form-label small fw-semibold text-muted mb-1">Até (Mês Final)</label>
                    <select id="selectMesAte" name="ate" class="form-select form-select-sm" required>
                        ${opcoesAteHtml}
                    </select>
                </div>
                <div class="col-12 col-md-4">
                    <button type="submit" id="btnExportarIntervalo" class="btn btn-sm btn-eco fw-bold w-100 shadow-sm eco-btn-intervalo">
                        <i class="ph-bold ph-file-xls me-1"></i> Baixar Intervalo (.XLSX)
                    </button>
                </div>
            </form>
        </div>
    </div>
    ` : '';

    const content = `
    <style>
        .eco-btn-intervalo {
            min-height: 31px;
        }

        /* =========================================================
           ADAPTAÇÕES MOBILE (< 768px)
        ========================================================= */
        @media (max-width: 767.98px) {
            .eco-btn-intervalo {
                min-height: 40px;
                margin-top: 4px;
            }

            #cardTabelaRelatorios .table-responsive {
                overflow-x: visible;
            }
            #cardTabelaRelatorios table,
            #cardTabelaRelatorios tbody {
                display: block;
                width: 100%;
            }
            #cardTabelaRelatorios thead {
                display: none;
            }
            #cardTabelaRelatorios tr.eco-rel-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 6px 10px;
                padding: 14px;
                border-bottom: 1px solid #eef0f3;
                background: #fff;
            }
            #cardTabelaRelatorios tr.eco-rel-row:last-of-type {
                border-bottom: none;
            }
            #cardTabelaRelatorios tr.eco-rel-row td {
                display: block;
                border: none;
                padding: 0 !important;
            }
            #cardTabelaRelatorios td.eco-rel-mes {
                grid-column: 1;
                grid-row: 1;
                font-size: 0.96rem;
                align-self: center;
            }
            #cardTabelaRelatorios td.eco-rel-status {
                grid-column: 2;
                grid-row: 1;
                justify-self: end;
                align-self: center;
            }
            #cardTabelaRelatorios td.eco-rel-desc {
                grid-column: 1 / -1;
                grid-row: 2;
                font-size: 0.8rem;
            }
            #cardTabelaRelatorios td.eco-rel-acao {
                grid-column: 1 / -1;
                grid-row: 3;
                text-align: left !important;
                margin-top: 4px;
            }
            #cardTabelaRelatorios .eco-rel-btn {
                width: 100%;
                min-height: 38px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            #cardTabelaRelatorios tr.eco-empty-row,
            #cardTabelaRelatorios tr.eco-empty-row td {
                display: block;
                width: 100%;
                border: none;
            }
        }
    </style>

    <div class="d-flex justify-content-between align-items-center mb-3">
        <p class="text-muted m-0 small">Exporte os resultados mensais individuais ou consolidados por intervalo para Excel (.xlsx).</p>
    </div>

    ${cardIntervaloHtml}

    <div id="cardTabelaRelatorios" class="card card-eco eco-loadable border-0">
        <div class="card-header bg-white py-2 px-3 border-bottom">
            <span class="small fw-bold text-muted">Relatórios Mensais Individuais</span>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover table-sm m-0" style="font-size: 0.9rem;">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-3 py-2">Mês Referência</th>
                            <th class="py-2">Status</th>
                            <th class="py-2">Conteúdo do Arquivo</th>
                            <th class="text-end pe-3 py-2">Exportação</th>
                        </tr>
                    </thead>
                    <tbody>${mesesHtml}</tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    const pageScripts = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var cardTabela = document.getElementById('cardTabelaRelatorios');
            var cardIntervalo = document.getElementById('cardRelatorioIntervalo');
            var formIntervalo = document.getElementById('formExportarIntervalo');
            var selectDe = document.getElementById('selectMesDe');
            var selectAte = document.getElementById('selectMesAte');
            var btnIntervalo = document.getElementById('btnExportarIntervalo');
            var badgeResumo = document.getElementById('badgeResumoIntervalo');

            function restaurarEstado(btn, container) {
                if (btn && btn.dataset.originalHtml) {
                    btn.innerHTML = btn.dataset.originalHtml;
                    btn.disabled = false;
                    btn.classList.remove('disabled');
                    btn.style.minWidth = '';
                    delete btn.dataset.isLoading;
                }
                if (container) {
                    var overlay = container.querySelector(':scope > .eco-loading-overlay');
                    if (overlay) overlay.remove();
                }
            }

            async function baixarExcel(url, btn, container, textoOverlay, mensagemSucesso) {
                if (!btn || btn.dataset.isLoading === 'true') return;

                window.setButtonLoading(btn, 'Gerando...');
                if (container) window.setContainerLoading(container, textoOverlay);

                try {
                    var response = await fetch(url, {
                        headers: { 'X-Requested-With': 'fetch' }
                    });

                    var contentType = response.headers.get('Content-Type') || '';
                    if (!response.ok || contentType.indexOf('spreadsheetml') === -1) {
                        var errMsg = 'Não foi possível gerar o relatório Excel.';
                        if (contentType.indexOf('application/json') !== -1) {
                            var errData = await response.json();
                            if (errData && errData.error) errMsg = errData.error;
                        }
                        throw new Error(errMsg);
                    }

                    var blob = await response.blob();
                    var filename = 'Relatorio_PontuaEco.xlsx';
                    var disposition = response.headers.get('Content-Disposition') || '';
                    var match = disposition.match(/filename="?([^";]+)"?/i);
                    if (match && match[1]) filename = match[1];

                    var downloadUrl = window.URL.createObjectURL(blob);
                    var linkTemp = document.createElement('a');
                    linkTemp.href = downloadUrl;
                    linkTemp.download = filename;
                    document.body.appendChild(linkTemp);
                    linkTemp.click();
                    document.body.removeChild(linkTemp);
                    window.URL.revokeObjectURL(downloadUrl);

                    window.showEcoToast(mensagemSucesso, 'success');
                } catch (err) {
                    window.showEcoToast(err.message || 'Erro ao exportar o relatório.', 'danger');
                } finally {
                    restaurarEstado(btn, container);
                }
            }

            // Atualiza contador visual de quantos meses estão no intervalo escolhido
            function atualizarResumoIntervalo() {
                if (!selectDe || !selectAte || !badgeResumo) return;
                var optDe = selectDe.options[selectDe.selectedIndex];
                var optAte = selectAte.options[selectAte.selectedIndex];
                if (!optDe || !optAte) return;

                var chaveDe = parseInt(optDe.getAttribute('data-chave') || '0', 10);
                var chaveAte = parseInt(optAte.getAttribute('data-chave') || '0', 10);

                if (chaveDe > chaveAte) {
                    badgeResumo.className = 'badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1';
                    badgeResumo.textContent = 'Intervalo inválido';
                    return;
                }

                var qtd = 0;
                Array.from(selectDe.options).forEach(function(opt) {
                    var c = parseInt(opt.getAttribute('data-chave') || '0', 10);
                    if (c >= chaveDe && c <= chaveAte) qtd++;
                });

                badgeResumo.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-1';
                badgeResumo.textContent = qtd + (qtd === 1 ? ' mês selecionado' : ' meses selecionados');
            }

            if (selectDe && selectAte) {
                selectDe.addEventListener('change', atualizarResumoIntervalo);
                selectAte.addEventListener('change', atualizarResumoIntervalo);
                atualizarResumoIntervalo();
            }

            // Exportação por Intervalo
            if (formIntervalo) {
                formIntervalo.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    var optDe = selectDe.options[selectDe.selectedIndex];
                    var optAte = selectAte.options[selectAte.selectedIndex];
                    var chaveDe = parseInt(optDe.getAttribute('data-chave') || '0', 10);
                    var chaveAte = parseInt(optAte.getAttribute('data-chave') || '0', 10);

                    if (chaveDe > chaveAte) {
                        window.showEcoToast('O mês inicial não pode ser posterior ao mês final.', 'danger');
                        return;
                    }

                    var labelDe = optDe.textContent.trim();
                    var labelAte = optAte.textContent.trim();
                    var labelPeriodo = selectDe.value === selectAte.value
                        ? labelDe
                        : labelDe + ' a ' + labelAte;

                    var url = '/relatorios/exportar-intervalo?de=' + encodeURIComponent(selectDe.value) + '&ate=' + encodeURIComponent(selectAte.value);
                    baixarExcel(
                        url,
                        btnIntervalo,
                        cardIntervalo,
                        'Gerando relatório consolidado (' + labelPeriodo + ')...',
                        'Relatório de ' + labelPeriodo + ' gerado! Download iniciado.'
                    );
                });
            }

            // Exportação Individual
            document.querySelectorAll('.btn-exportar-xlsx').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    var url = btn.getAttribute('href');
                    var mesLabel = btn.getAttribute('data-mes') || '';
                    baixarExcel(
                        url,
                        btn,
                        cardTabela,
                        'Gerando relatório Excel...',
                        mesLabel
                            ? 'Relatório de ' + mesLabel + ' gerado! Download iniciado.'
                            : 'Relatório Excel gerado com sucesso!'
                    );
                });
            });
        });
    </script>
    `;

    const toastObj = msg ? { msg, tipo: tipoMsg } : null;
    return renderLayout('Relatórios Excel', content, pageScripts, usuarioLogado, toastObj);
};