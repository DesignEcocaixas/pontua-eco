// Arquivo: routes/mesesRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarAuth, verificarAdmin } = require('../middlewares/auth');

const renderMeses = require('../views/meses');
const renderMesDetalhes = require('../views/mesDetalhes');
const indicadoresService = require('../services/indicadoresService');

// Helper para ler e limpar o toast da sessão (flash message)
function consumirToast(req) {
    const toast = req.session.toast || null;
    delete req.session.toast;
    return toast;
}

// Helper para normalizar campos de um registro conforme o tipo
function extrairCamposRegistro(dados) {
    const tipo = dados.tipo;
    let qtdAlteracoes = 0;
    let tempoProducao = 0;
    let prazoOuDias = 0;

    if (['Post', 'Carrossel', 'Stories', 'Reels'].includes(tipo)) {
        qtdAlteracoes = dados.qtd_alteracoes ? parseInt(dados.qtd_alteracoes, 10) : 0;
        tempoProducao = dados.tempo_producao_minutos ? parseInt(dados.tempo_producao_minutos, 10) : 0;
    } else if (tipo === 'Arte Fantasia') {
        qtdAlteracoes = dados.qtd_alteracoes ? parseInt(dados.qtd_alteracoes, 10) : 0;
    } else if (tipo === 'Arte de Cliente') {
        qtdAlteracoes = dados.qtd_alteracoes ? parseInt(dados.qtd_alteracoes, 10) : 0;
        prazoOuDias = dados.prazo_horas ? parseInt(dados.prazo_horas, 10) : 24;
    } else if (tipo === 'Clichê') {
        prazoOuDias = dados.qtd_dias ? parseInt(dados.qtd_dias, 10) : 0;
    }

    return { qtdAlteracoes, tempoProducao, prazoOuDias };
}

// ----------------------------------------------------------------------
// GESTÃO DE MESES
// ----------------------------------------------------------------------
router.get('/', verificarAuth, async (req, res) => {
    try {
        const toast = consumirToast(req);
        const [meses] = await db.query('SELECT * FROM meses ORDER BY ano DESC, id DESC');
        res.send(renderMeses(meses, toast ? toast.msg : null, toast ? toast.tipo : 'success', req.session.usuario));
    } catch (error) {
        console.error(error);
        res.send(renderMeses([], 'Erro ao carregar os meses.', 'danger', req.session.usuario));
    }
});

router.post('/', verificarAuth, verificarAdmin, async (req, res) => {
    const { nome, ano } = req.body;
    try {
        const [existe] = await db.query('SELECT id FROM meses WHERE nome = ? AND ano = ?', [nome, ano]);
        if (existe.length > 0) {
            req.session.toast = { msg: `O mês de ${nome}/${ano} já existe!`, tipo: 'danger' };
            return res.redirect('/meses');
        }

        await db.query('INSERT INTO meses (nome, ano, meta_pontos, status) VALUES (?, ?, 0, ?)', [nome, ano, 'aberto']);
        req.session.toast = { msg: `Mês ${nome}/${ano} criado e aberto com sucesso!`, tipo: 'success' };
        res.redirect('/meses');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao criar o mês.', tipo: 'danger' };
        res.redirect('/meses');
    }
});

// Editar Mês (Nome, Ano e Status)
router.post('/editar/:id', verificarAuth, verificarAdmin, async (req, res) => {
    const { nome, ano, status } = req.body;
    const mesId = req.params.id;
    const statusValido = status === 'fechado' ? 'fechado' : 'aberto';

    try {
        const [existe] = await db.query(
            'SELECT id FROM meses WHERE nome = ? AND ano = ? AND id <> ?',
            [nome, ano, mesId]
        );
        if (existe.length > 0) {
            req.session.toast = { msg: `Já existe outro ciclo cadastrado para ${nome}/${ano}.`, tipo: 'danger' };
            return res.redirect('/meses');
        }

        await db.query(
            'UPDATE meses SET nome = ?, ano = ?, status = ? WHERE id = ?',
            [nome, ano, statusValido, mesId]
        );
        req.session.toast = { msg: `Mês ${nome}/${ano} atualizado com sucesso!`, tipo: 'success' };
        res.redirect('/meses');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao atualizar o mês.', tipo: 'danger' };
        res.redirect('/meses');
    }
});

router.post('/excluir/:id', verificarAuth, verificarAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM meses WHERE id = ?', [req.params.id]);
        req.session.toast = { msg: 'Mês excluído com sucesso.', tipo: 'success' };
        res.redirect('/meses');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Não é possível excluir um mês que possui registros vinculados.', tipo: 'danger' };
        res.redirect('/meses');
    }
});

// ----------------------------------------------------------------------
// GESTÃO DE REGISTROS DENTRO DO MÊS (mesDetalhes)
// ----------------------------------------------------------------------
router.get('/:id', verificarAuth, async (req, res) => {
    try {
        const [meses] = await db.query('SELECT * FROM meses WHERE id = ?', [req.params.id]);
        if (meses.length === 0) {
            req.session.toast = { msg: 'Mês não encontrado.', tipo: 'danger' };
            return res.redirect('/meses');
        }
        
        const mes = meses[0];
        const [registros] = await db.query('SELECT * FROM registros WHERE mes_id = ? ORDER BY id DESC', [mes.id]);
        const analise = indicadoresService.processarMes(registros);
        
        const [ideiasAprovadas] = await db.query('SELECT * FROM ideias WHERE mes_id = ? AND status = "aprovada"', [mes.id]);
        const [bonificacoes] = await db.query('SELECT * FROM regras_bonificacao ORDER BY pontos_min ASC');
        
        let bonusIdeias = 0;
        ideiasAprovadas.forEach(ideia => {
            bonusIdeias += parseInt(ideia.pontos_bonus || 0, 10);
            registros.push({
                id: ideia.id,
                tipo: 'Nova Ideia',
                cliente: ideia.titulo,
                descricao: ideia.descricao || '',
                qtd_alteracoes: '-',
                status: 'aprovado',
                isIdeia: true,
                pontosBonus: ideia.pontos_bonus,
                created_at: ideia.created_at || ideia.data_criacao || ideia.data || null
            });
        });
        
        analise.totalConsolidado += bonusIdeias;
        if (bonusIdeias > 0) {
            analise.analiseCategorias.push({
                tipo: 'Ideias Aprovadas',
                qtdRegistros: ideiasAprovadas.length,
                pontos: bonusIdeias,
                mensagem: 'Pontos bônus concedidos no mês'
            });
        }

        const toast = consumirToast(req);
        res.send(renderMesDetalhes(
            mes,
            registros,
            analise,
            toast ? toast.msg : null,
            toast ? toast.tipo : 'success',
            req.session.usuario,
            bonificacoes
        ));
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao carregar os detalhes do mês.', tipo: 'danger' };
        res.redirect('/meses');
    }
});

// Cadastrar novo Registro no Mês
router.post('/:id/registros', verificarAuth, async (req, res) => {
    const mesId = req.params.id;
    const usuarioId = req.session.usuario.id;
    const dados = req.body;
    
    try {
        const { qtdAlteracoes, tempoProducao, prazoOuDias } = extrairCamposRegistro(dados);

        await db.query(`
            INSERT INTO registros 
            (mes_id, usuario_id, tipo, cliente, descricao, qtd_alteracoes, tempo_producao_minutos, qtd_dias, pontos_calculados, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'aprovado')`, 
            [mesId, usuarioId, dados.tipo, dados.cliente || '', dados.descricao || '', qtdAlteracoes, tempoProducao, prazoOuDias]
        );

        req.session.toast = { msg: `Registro "${dados.tipo}" adicionado e SLA recalculado!`, tipo: 'success' };
        res.redirect(`/meses/${mesId}`); } catch (error) { console.error(error); req.session.toast = { msg: 'Erro ao salvar o registro. Tente novamente.', tipo: 'danger' }; res.redirect(`/meses/${mesId}`);
    }
});

// Editar Registro existente no Mês
router.post('/:id/registros/:registroId/editar', verificarAuth, async (req, res) => {
    const mesId = req.params.id;
    const registroId = req.params.registroId;
    const dados = req.body;

    try {
        const { qtdAlteracoes, tempoProducao, prazoOuDias } = extrairCamposRegistro(dados);

        await db.query(`
            UPDATE registros
            SET tipo = ?, cliente = ?, descricao = ?, qtd_alteracoes = ?, tempo_producao_minutos = ?, qtd_dias = ?
            WHERE id = ? AND mes_id = ?`,
            [dados.tipo, dados.cliente || '', dados.descricao || '', qtdAlteracoes, tempoProducao, prazoOuDias, registroId, mesId]
        );

        req.session.toast = { msg: `Registro "${dados.tipo}" atualizado e SLA recalculado!`, tipo: 'success' };
        res.redirect(`/meses/${mesId}`); } catch (error) { console.error(error); req.session.toast = { msg: 'Erro ao atualizar o registro. Tente novamente.', tipo: 'danger' }; res.redirect(`/meses/${mesId}`);
    }
});

// Excluir Registro
router.post('/:id/registros/:registroId/excluir', verificarAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM registros WHERE id = ? AND mes_id = ?', [req.params.registroId, req.params.id]);
        req.session.toast = { msg: 'Registro excluído e pontuação atualizada.', tipo: 'success' };
        res.redirect(`/meses/${req.params.id}`); } catch (error) { console.error(error); req.session.toast = { msg: 'Erro ao excluir o registro.', tipo: 'danger' }; res.redirect(`/meses/${req.params.id}`);
    }
});

module.exports = router;