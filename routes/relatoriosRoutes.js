// Arquivo: routes/relatoriosRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const ExcelJS = require('exceljs');
const { verificarAuth } = require('../middlewares/auth');

const renderRelatorios = require('../views/relatorios');
const indicadoresService = require('../services/indicadoresService');
const bonificacaoService = require('../services/bonificacaoService');

const MOEDA = 'R' + String.fromCharCode(36);

const MAPA_MESES = {
    janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
};

// Helper para ler e limpar o toast da sessão (flash message)
function consumirToast(req) {
    const toast = req.session.toast || null;
    delete req.session.toast;
    return toast;
}

// Gera chave numérica cronológica (ex: Agosto/2026 -> 202608)
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

// Sanitiza nomes de abas conforme limites do Excel (máx. 31 chars e sem caracteres proibidos)
function sanitizarNomeAba(nome, usados) {
    let base = String(nome || 'Mes')
        .replace(/[*?:\\/\[\]]/g, '-')
        .trim()
        .slice(0, 31);
    if (!base) base = 'Mes';

    let final = base;
    let contador = 2;
    while (usados.has(final.toLowerCase())) {
        const sufixo = ' (' + contador + ')';
        final = base.slice(0, 31 - sufixo.length) + sufixo;
        contador++;
    }
    usados.add(final.toLowerCase());
    return final;
}

function sanitizarNomeArquivo(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function formatarMoeda(valor) {
    return MOEDA + ' ' + parseFloat(valor || 0).toFixed(2).replace('.', ',');
}

function estilizarCabecalhoLinha(row, totalCols) {
    row.height = 22;
    for (let i = 1; i <= totalCols; i++) {
        const cell = row.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6B3A' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF0B6B3A' } },
            left: { style: 'thin', color: { argb: 'FF0B6B3A' } },
            bottom: { style: 'thin', color: { argb: 'FF0B6B3A' } },
            right: { style: 'thin', color: { argb: 'FF0B6B3A' } }
        };
    }
}

function estilizarTituloSecao(ws, rowNum, titulo, totalCols) {
    ws.mergeCells(rowNum, 1, rowNum, totalCols);
    const cell = ws.getCell(rowNum, 1);
    cell.value = titulo;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F3EC' } };
    cell.font = { color: { argb: 'FF0B6B3A' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(rowNum).height = 24;
}

function estilizarBordaLinha(row, totalCols) {
    for (let i = 1; i <= totalCols; i++) {
        row.getCell(i).border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
    }
}

// Busca e processa todos os dados consolidados de um mês
async function carregarDadosCompletosMes(mes) {
    const [registros] = await db.query(
        'SELECT r.*, u.nome as autor FROM registros r JOIN usuarios u ON r.usuario_id = u.id WHERE mes_id = ? ORDER BY r.tipo ASC, r.id DESC',
        [mes.id]
    );
    const [ideias] = await db.query(
        'SELECT i.*, u.nome as autor FROM ideias i JOIN usuarios u ON i.usuario_id = u.id WHERE mes_id = ? AND status = "aprovada" ORDER BY i.id DESC',
        [mes.id]
    );

    const analise = indicadoresService.processarMes(registros);
    let bonusIdeias = 0;
    ideias.forEach(ideia => {
        bonusIdeias += parseInt(ideia.pontos_bonus || 0, 10);
    });

    const pontosTotais = analise.totalConsolidado + bonusIdeias;
    const bonificacao = await bonificacaoService.calcularBonificacao(pontosTotais);

    return { mes, registros, ideias, analise, bonusIdeias, pontosTotais, bonificacao };
}

// ----------------------------------------------------------------------
// 1. Tela de Relatórios (Lista os meses em ordem cronológica decrescente)
// ----------------------------------------------------------------------
router.get('/', verificarAuth, async (req, res) => {
    try {
        const toast = consumirToast(req);
        const [mesesRaw] = await db.query('SELECT * FROM meses');
        const meses = mesesRaw.sort((a, b) => obterChaveMes(b) - obterChaveMes(a));

        res.send(renderRelatorios(
            meses,
            toast ? toast.msg : null,
            toast ? toast.tipo : 'success',
            req.session.usuario
        ));
    } catch (error) {
        console.error(error);
        res.send(renderRelatorios([], 'Erro ao carregar os relatórios.', 'danger', req.session.usuario));
    }
});

// ----------------------------------------------------------------------
// 2. Exportação Completa por Intervalo de Meses (1 aba por mês + Resumo)
// ----------------------------------------------------------------------
router.get('/exportar-intervalo', verificarAuth, async (req, res) => {
    const isFetch = req.headers['x-requested-with'] === 'fetch';
    const mesInicioId = parseInt(req.query.de, 10);
    const mesFimId = parseInt(req.query.ate, 10);

    const responderErro = (status, msg) => {
        if (isFetch) return res.status(status).json({ error: msg });
        req.session.toast = { msg, tipo: 'danger' };
        return res.redirect('/relatorios');
    };

    try {
        if (!mesInicioId || !mesFimId) {
            return responderErro(400, 'Selecione o mês inicial e o mês final do intervalo.');
        }

        const [todosMeses] = await db.query('SELECT * FROM meses');
        const mesInicio = todosMeses.find(m => m.id === mesInicioId);
        const mesFim = todosMeses.find(m => m.id === mesFimId);

        if (!mesInicio || !mesFim) {
            return responderErro(404, 'Um ou mais meses selecionados não foram encontrados.');
        }

        const chaveInicio = obterChaveMes(mesInicio);
        const chaveFim = obterChaveMes(mesFim);

        if (chaveInicio > chaveFim) {
            return responderErro(400, 'O mês inicial não pode ser posterior ao mês final.');
        }

        // Seleciona todos os meses cadastrados dentro do intervalo em ordem cronológica
        const mesesNoIntervalo = todosMeses
            .filter(m => {
                const chave = obterChaveMes(m);
                return chave >= chaveInicio && chave <= chaveFim;
            })
            .sort((a, b) => obterChaveMes(a) - obterChaveMes(b));

        if (mesesNoIntervalo.length === 0) {
            return responderErro(404, 'Nenhum mês encontrado no intervalo selecionado.');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Pontua Eco';
        workbook.created = new Date();

        const nomesAbasUsados = new Set(['resumo geral']);

        // ABA 1: RESUMO GERAL DO PERÍODO
        const wsGeral = workbook.addWorksheet('Resumo Geral');
        wsGeral.columns = [
            { width: 22 }, // Mês / Ano
            { width: 14 }, // Status
            { width: 16 }, // Atividades
            { width: 16 }, // Pontos SLA
            { width: 16 }, // Pontos Ideias
            { width: 18 }, // Pontuação Final
            { width: 20 }  // Bonificação
        ];

        const periodoLabel = mesInicio.id === mesFim.id
            ? mesInicio.nome + '/' + mesInicio.ano
            : mesInicio.nome + '/' + mesInicio.ano + ' a ' + mesFim.nome + '/' + mesFim.ano;

        wsGeral.mergeCells('A1:G1');
        const tituloGeral = wsGeral.getCell('A1');
        tituloGeral.value = 'PONTUA ECO — RELATÓRIO CONSOLIDADO (' + periodoLabel.toUpperCase() + ')';
        tituloGeral.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6B3A' } };
        tituloGeral.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
        tituloGeral.alignment = { vertical: 'middle', horizontal: 'center' };
        wsGeral.getRow(1).height = 28;

        const headerGeral = wsGeral.addRow([
            'Mês / Ano',
            'Status',
            'Atividades',
            'Pontos SLA',
            'Pontos Ideias',
            'Pontuação Final',
            'Bonificação (' + MOEDA + ')'
        ]);
        estilizarCabecalhoLinha(headerGeral, 7);

        let somaAtividades = 0;
        let somaPontosSla = 0;
        let somaPontosIdeias = 0;
        let somaPontosFinal = 0;
        let somaBonificacao = 0;

        // Gera uma aba completa para cada mês do intervalo
        for (const mes of mesesNoIntervalo) {
            const dados = await carregarDadosCompletosMes(mes);

            somaAtividades += dados.registros.length;
            somaPontosSla += dados.analise.totalConsolidado;
            somaPontosIdeias += dados.bonusIdeias;
            somaPontosFinal += dados.pontosTotais;
            somaBonificacao += parseFloat(dados.bonificacao.valor || 0);

            const rowResumo = wsGeral.addRow([
                mes.nome + ' / ' + mes.ano,
                String(mes.status || '').toUpperCase(),
                dados.registros.length,
                dados.analise.totalConsolidado,
                dados.bonusIdeias,
                dados.pontosTotais,
                formatarMoeda(dados.bonificacao.valor)
            ]);
            estilizarBordaLinha(rowResumo, 7);
            rowResumo.getCell(2).alignment = { horizontal: 'center' };
            rowResumo.getCell(3).alignment = { horizontal: 'center' };
            rowResumo.getCell(4).alignment = { horizontal: 'center' };
            rowResumo.getCell(5).alignment = { horizontal: 'center' };
            rowResumo.getCell(6).alignment = { horizontal: 'center' };
            rowResumo.getCell(6).font = { bold: true };
            rowResumo.getCell(7).alignment = { horizontal: 'right' };
            rowResumo.getCell(7).font = { bold: true, color: { argb: 'FF0B6B3A' } };

            // ABA DEDICADA DO MÊS (ex: "Agosto 2026")
            const nomeAba = sanitizarNomeAba(mes.nome + ' ' + mes.ano, nomesAbasUsados);
            const wsMes = workbook.addWorksheet(nomeAba);
            wsMes.columns = [
                { width: 22 }, // Col A
                { width: 32 }, // Col B
                { width: 22 }, // Col C
                { width: 14 }, // Col D
                { width: 15 }, // Col E
                { width: 15 }, // Col F
                { width: 15 }, // Col G
                { width: 42 }  // Col H
            ];

            // Banner do Mês
            wsMes.mergeCells('A1:H1');
            const banner = wsMes.getCell('A1');
            banner.value = 'RELATÓRIO COMPLETO — ' + String(mes.nome || '').toUpperCase() + ' / ' + mes.ano;
            banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6B3A' } };
            banner.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
            banner.alignment = { vertical: 'middle', horizontal: 'center' };
            wsMes.getRow(1).height = 28;

            // SEÇÃO 1: RESUMO DO MÊS
            let linha = 3;
            estilizarTituloSecao(wsMes, linha++, '1. RESUMO DO MÊS', 8);

            const hdrResumo = wsMes.getRow(linha++);
            hdrResumo.values = ['Informação', 'Resultado'];
            estilizarCabecalhoLinha(hdrResumo, 2);

            const itensResumo = [
                ['Mês / Ano', mes.nome + ' / ' + mes.ano],
                ['Status do Mês', String(mes.status || '').toUpperCase()],
                ['Pontos do SLA (Atividades)', dados.analise.totalConsolidado],
                ['Pontos de Ideias Aprovadas', dados.bonusIdeias],
                ['Pontuação Final', dados.pontosTotais],
                ['Bonificação (' + MOEDA + ')', formatarMoeda(dados.bonificacao.valor)]
            ];

            itensResumo.forEach(([info, resultado], idx) => {
                const r = wsMes.getRow(linha++);
                r.values = [info, resultado];
                estilizarBordaLinha(r, 2);
                if (idx === 4) r.font = { bold: true };
                if (idx === 5) r.font = { bold: true, color: { argb: 'FF0B6B3A' } };
            });

            // SEÇÃO 2: SLA POR CATEGORIA
            linha += 1;
            estilizarTituloSecao(wsMes, linha++, '2. SLA POR CATEGORIA', 8);

            const hdrSla = wsMes.getRow(linha++);
            hdrSla.values = ['Categoria', 'Qtd Registros', 'Pontos Conquistados', 'Desempenho / Análise'];
            wsMes.mergeCells(hdrSla.number, 4, hdrSla.number, 8);
            estilizarCabecalhoLinha(hdrSla, 8);

            if (dados.analise.analiseCategorias.length === 0) {
                const rVazio = wsMes.getRow(linha++);
                rVazio.getCell(1).value = 'Nenhuma atividade contabilizada no SLA deste mês.';
                rVazio.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
                wsMes.mergeCells(rVazio.number, 1, rVazio.number, 8);
            } else {
                dados.analise.analiseCategorias.forEach(cat => {
                    const r = wsMes.getRow(linha++);
                    r.getCell(1).value = cat.tipo;
                    r.getCell(2).value = cat.qtdRegistros;
                    r.getCell(3).value = cat.pontos;
                    r.getCell(4).value = cat.mensagem;
                    wsMes.mergeCells(r.number, 4, r.number, 8);
                    r.getCell(2).alignment = { horizontal: 'center' };
                    r.getCell(3).alignment = { horizontal: 'center' };
                    r.getCell(3).font = { bold: true, color: { argb: 'FF0B6B3A' } };
                    estilizarBordaLinha(r, 8);
                });
            }

            // SEÇÃO 3: ATIVIDADES CADASTRADAS
            linha += 1;
            estilizarTituloSecao(wsMes, linha++, '3. ATIVIDADES CADASTRADAS', 8);

            const hdrAtiv = wsMes.getRow(linha++);
            hdrAtiv.values = [
                'Tipo',
                'Cliente / Título',
                'Autor',
                'Alterações',
                'Tempo (Min)',
                'Prazo / Dias',
                'Status',
                'Descrição'
            ];
            estilizarCabecalhoLinha(hdrAtiv, 8);

            if (dados.registros.length === 0) {
                const rVazio = wsMes.getRow(linha++);
                rVazio.getCell(1).value = 'Nenhuma atividade registrada neste mês.';
                rVazio.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
                wsMes.mergeCells(rVazio.number, 1, rVazio.number, 8);
            } else {
                dados.registros.forEach(reg => {
                    const r = wsMes.getRow(linha++);
                    r.values = [
                        reg.tipo,
                        reg.cliente || '-',
                        reg.autor,
                        reg.qtd_alteracoes,
                        reg.tempo_producao_minutos || '-',
                        reg.qtd_dias || '-',
                        String(reg.status || '').toUpperCase(),
                        reg.descricao || ''
                    ];
                    r.getCell(4).alignment = { horizontal: 'center' };
                    r.getCell(5).alignment = { horizontal: 'center' };
                    r.getCell(6).alignment = { horizontal: 'center' };
                    r.getCell(7).alignment = { horizontal: 'center' };
                    estilizarBordaLinha(r, 8);
                });
            }

            // SEÇÃO 4: IDEIAS APROVADAS
            linha += 1;
            estilizarTituloSecao(wsMes, linha++, '4. IDEIAS APROVADAS', 8);

            const hdrIdeias = wsMes.getRow(linha++);
            hdrIdeias.values = ['Título', 'Autor', 'Pontos Bônus', 'Descrição'];
            wsMes.mergeCells(hdrIdeias.number, 4, hdrIdeias.number, 8);
            estilizarCabecalhoLinha(hdrIdeias, 8);

            if (dados.ideias.length === 0) {
                const rVazio = wsMes.getRow(linha++);
                rVazio.getCell(1).value = 'Nenhuma ideia aprovada neste mês.';
                rVazio.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
                wsMes.mergeCells(rVazio.number, 1, rVazio.number, 8);
            } else {
                dados.ideias.forEach(ideia => {
                    const r = wsMes.getRow(linha++);
                    r.getCell(1).value = ideia.titulo;
                    r.getCell(2).value = ideia.autor;
                    r.getCell(3).value = '+' + ideia.pontos_bonus;
                    r.getCell(4).value = ideia.descricao || '';
                    wsMes.mergeCells(r.number, 4, r.number, 8);
                    r.getCell(3).alignment = { horizontal: 'center' };
                    r.getCell(3).font = { bold: true, color: { argb: 'FF0B6B3A' } };
                    estilizarBordaLinha(r, 8);
                });
            }
        }

        // Linha de TOTAL DO PERÍODO no Resumo Geral
        const labelQtdMeses = mesesNoIntervalo.length === 1 ? 'mês' : 'meses';
        const rowTotal = wsGeral.addRow([
            'TOTAL DO PERÍODO (' + mesesNoIntervalo.length + ' ' + labelQtdMeses + ')',
            '-',
            somaAtividades,
            somaPontosSla,
            somaPontosIdeias,
            somaPontosFinal,
            formatarMoeda(somaBonificacao)
        ]);
        rowTotal.height = 24;
        for (let i = 1; i <= 7; i++) {
            const cell = rowTotal.getCell(i);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F3EC' } };
            cell.font = { bold: true, color: { argb: 'FF0B6B3A' } };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF0B6B3A' } },
                left: { style: 'thin', color: { argb: 'FF0B6B3A' } },
                bottom: { style: 'medium', color: { argb: 'FF0B6B3A' } },
                right: { style: 'thin', color: { argb: 'FF0B6B3A' } }
            };
        }
        rowTotal.getCell(2).alignment = { horizontal: 'center' };
        rowTotal.getCell(3).alignment = { horizontal: 'center' };
        rowTotal.getCell(4).alignment = { horizontal: 'center' };
        rowTotal.getCell(5).alignment = { horizontal: 'center' };
        rowTotal.getCell(6).alignment = { horizontal: 'center' };
        rowTotal.getCell(7).alignment = { horizontal: 'right' };

        const nomeArquivo = mesInicio.id === mesFim.id
            ? 'Relatorio_PontuaEco_' + sanitizarNomeArquivo(mesInicio.nome) + '_' + mesInicio.ano + '.xlsx'
            : 'Relatorio_PontuaEco_' + sanitizarNomeArquivo(mesInicio.nome) + '_' + mesInicio.ano + '_a_' + sanitizarNomeArquivo(mesFim.nome) + '_' + mesFim.ano + '.xlsx';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="' + nomeArquivo + '"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        return responderErro(500, 'Erro interno ao gerar o relatório consolidado por intervalo.');
    }
});

// ----------------------------------------------------------------------
// 3. Exportação Individual de um Mês
// ----------------------------------------------------------------------
router.get('/exportar/:id', verificarAuth, async (req, res) => {
    const isFetch = req.headers['x-requested-with'] === 'fetch';

    try {
        const mesId = req.params.id;
        const [meses] = await db.query('SELECT * FROM meses WHERE id = ?', [mesId]);

        if (meses.length === 0) {
            if (isFetch) return res.status(404).json({ error: 'Mês não encontrado para exportação.' });
            req.session.toast = { msg: 'Mês não encontrado para exportação.', tipo: 'danger' };
            return res.redirect('/relatorios');
        }

        const { mes, registros, ideias, analise, bonusIdeias, pontosTotais, bonificacao } =
            await carregarDadosCompletosMes(meses[0]);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Pontua Eco';
        workbook.created = new Date();

        const applyHeaderStyle = (worksheet) => {
            worksheet.getRow(1).eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6B3A' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        };

        // ABA 1: RESUMO
        const wsResumo = workbook.addWorksheet('Resumo do Mês');
        wsResumo.columns = [
            { header: 'Informação', key: 'info', width: 30 },
            { header: 'Resultado', key: 'resultado', width: 25 }
        ];
        applyHeaderStyle(wsResumo);
        wsResumo.addRow({ info: 'Mês / Ano', resultado: mes.nome + ' / ' + mes.ano });
        wsResumo.addRow({ info: 'Status do Mês', resultado: String(mes.status || '').toUpperCase() });
        wsResumo.addRow({ info: 'Pontos do SLA (Atividades)', resultado: analise.totalConsolidado });
        wsResumo.addRow({ info: 'Pontos de Ideias Aprovadas', resultado: bonusIdeias });
        wsResumo.addRow({ info: 'Pontuação Final', resultado: pontosTotais });
        wsResumo.addRow({ info: 'Bonificação (' + MOEDA + ')', resultado: formatarMoeda(bonificacao.valor) });
        wsResumo.getRow(6).font = { bold: true };
        wsResumo.getRow(7).font = { bold: true, color: { argb: 'FF0B6B3A' } };

        // ABA 2: SLA POR CATEGORIA
        const wsSla = workbook.addWorksheet('SLA por Categoria');
        wsSla.columns = [
            { header: 'Categoria', key: 'categoria', width: 20 },
            { header: 'Qtd Registros', key: 'qtd', width: 15 },
            { header: 'Pontos Conquistados', key: 'pontos', width: 20 },
            { header: 'Desempenho / Análise', key: 'mensagem', width: 50 }
        ];
        applyHeaderStyle(wsSla);
        analise.analiseCategorias.forEach(cat => {
            wsSla.addRow({
                categoria: cat.tipo,
                qtd: cat.qtdRegistros,
                pontos: cat.pontos,
                mensagem: cat.mensagem
            });
        });

        // ABA 3: REGISTROS INDIVIDUAIS
        const wsRegistros = workbook.addWorksheet('Atividades Cadastradas');
        wsRegistros.columns = [
            { header: 'Tipo', key: 'tipo', width: 20 },
            { header: 'Cliente/Título', key: 'cliente', width: 30 },
            { header: 'Autor', key: 'autor', width: 20 },
            { header: 'Alterações', key: 'alt', width: 12 },
            { header: 'Tempo (Min)', key: 'tempo', width: 15 },
            { header: 'Prazo/Dias', key: 'dias', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Descrição', key: 'desc', width: 40 }
        ];
        applyHeaderStyle(wsRegistros);
        registros.forEach(reg => {
            wsRegistros.addRow({
                tipo: reg.tipo,
                cliente: reg.cliente,
                autor: reg.autor,
                alt: reg.qtd_alteracoes,
                tempo: reg.tempo_producao_minutos || '-',
                dias: reg.qtd_dias || '-',
                status: String(reg.status || '').toUpperCase(),
                desc: reg.descricao
            });
        });

        // ABA 4: IDEIAS
        if (ideias.length > 0) {
            const wsIdeias = workbook.addWorksheet('Ideias Aprovadas');
            wsIdeias.columns = [
                { header: 'Título', key: 'titulo', width: 35 },
                { header: 'Autor', key: 'autor', width: 20 },
                { header: 'Pontos Bônus', key: 'bonus', width: 15 },
                { header: 'Descrição', key: 'desc', width: 50 }
            ];
            applyHeaderStyle(wsIdeias);
            ideias.forEach(ideia => {
                wsIdeias.addRow({
                    titulo: ideia.titulo,
                    autor: ideia.autor,
                    bonus: '+' + ideia.pontos_bonus,
                    desc: ideia.descricao
                });
            });
        }

        const nomeArquivo = 'Relatorio_PontuaEco_' + sanitizarNomeArquivo(mes.nome) + '_' + mes.ano + '.xlsx';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="' + nomeArquivo + '"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        if (isFetch) return res.status(500).json({ error: 'Erro interno ao gerar o arquivo Excel.' });
        req.session.toast = { msg: 'Erro ao gerar o relatório Excel.', tipo: 'danger' };
        res.redirect('/relatorios');
    }
});

module.exports = router;