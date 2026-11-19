// Arquivo: routes/ideiasRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarAuth, verificarAdmin } = require('../middlewares/auth');
const renderIdeias = require('../views/ideias');

// Helper para ler e limpar o toast da sessão (flash message)
function consumirToast(req) {
    const toast = req.session.toast || null;
    delete req.session.toast;
    return toast;
}

// Listar todas as ideias
router.get('/', verificarAuth, async (req, res) => {
    try {
        const [ideias] = await db.query(`
            SELECT i.*, u.nome as autor, m.nome as mes_nome, m.ano as mes_ano 
            FROM ideias i 
            JOIN usuarios u ON i.usuario_id = u.id 
            JOIN meses m ON i.mes_id = m.id 
            ORDER BY i.id DESC
        `);
        
        const [mesesAbertos] = await db.query('SELECT id, nome, ano FROM meses WHERE status = "aberto"');
        const toast = consumirToast(req);
        
        res.send(renderIdeias(
            ideias,
            mesesAbertos,
            req.session.usuario,
            toast ? toast.msg : null,
            toast ? toast.tipo : 'success'
        ));
    } catch (error) {
        console.error(error);
        res.send(renderIdeias([], [], req.session.usuario, 'Erro ao carregar o banco de ideias.', 'danger'));
    }
});

// Cadastrar nova ideia
router.post('/', verificarAuth, async (req, res) => {
    const { mes_id, titulo, descricao } = req.body;
    try {
        await db.query(
            'INSERT INTO ideias (usuario_id, mes_id, titulo, descricao) VALUES (?, ?, ?, ?)', 
            [req.session.usuario.id, mes_id, titulo, descricao]
        );
        req.session.toast = { msg: `Ideia "${titulo}" enviada para avaliação!`, tipo: 'success' };
        res.redirect('/ideias');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao cadastrar a ideia. Tente novamente.', tipo: 'danger' };
        res.redirect('/ideias');
    }
});

// Avaliar Ideia (Restrito a Admin)
router.post('/:id/avaliar', verificarAuth, verificarAdmin, async (req, res) => {
    const { status, pontos_bonus } = req.body;
    const pontos = status === 'aprovada' ? parseInt(pontos_bonus || 0) : 0;
    try {
        await db.query(
            'UPDATE ideias SET status = ?, pontos_bonus = ? WHERE id = ?',
            [status, pontos, req.params.id]
        );
        req.session.toast = {
            msg: status === 'aprovada'
                ? `Ideia aprovada com +${pontos} pontos bônus!`
                : 'Ideia avaliada e marcada como rejeitada.',
            tipo: 'success'
        };
        res.redirect('/ideias');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao salvar a avaliação da ideia.', tipo: 'danger' };
        res.redirect('/ideias');
    }
});

// Excluir Ideia
router.post('/:id/excluir', verificarAuth, async (req, res) => {
    try {
        if (req.session.usuario.perfil === 'admin') {
            await db.query('DELETE FROM ideias WHERE id = ?', [req.params.id]);
        } else {
            await db.query('DELETE FROM ideias WHERE id = ? AND usuario_id = ?', [req.params.id, req.session.usuario.id]);
        }
        req.session.toast = { msg: 'Ideia excluída com sucesso.', tipo: 'success' };
        res.redirect('/ideias');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao excluir a ideia.', tipo: 'danger' };
        res.redirect('/ideias');
    }
});

module.exports = router;