// Arquivo: routes/configuracoesRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { verificarAuth, verificarAdmin } = require('../middlewares/auth');
const renderConfiguracoes = require('../views/configuracoes');

// Helper para ler e limpar o toast da sessão (flash message)
function consumirToast(req) {
    const toast = req.session.toast || null;
    delete req.session.toast;
    return toast;
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads/perfis');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'user_' + req.session.usuario.id + '_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.use(verificarAuth);

// ---------------------------------------------------------
// TELA DE CONFIGURAÇÕES / PERFIL
// ---------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        let usuarios = [];
        let bonificacoes = [];
        
        const [meuUsuario] = await db.query('SELECT * FROM usuarios WHERE id = ?', [req.session.usuario.id]);
        const dadosCompletosLogado = meuUsuario[0];
        
        if (req.session.usuario.perfil === 'admin') {
            [usuarios] = await db.query('SELECT id, nome, email, perfil, foto FROM usuarios ORDER BY nome ASC');
            [bonificacoes] = await db.query('SELECT * FROM regras_bonificacao ORDER BY pontos_min ASC');
        }

        const toast = consumirToast(req);
        res.send(renderConfiguracoes(
            dadosCompletosLogado,
            usuarios,
            bonificacoes,
            toast ? toast.msg : null,
            toast ? toast.tipo : 'success'
        ));
    } catch (error) {
        console.error(error);
        res.send(renderConfiguracoes(req.session.usuario, [], [], 'Erro ao carregar configurações.', 'danger'));
    }
});

// Atualizar o PRÓPRIO perfil e FOTO
router.post('/perfil', upload.single('foto'), async (req, res) => {
    const { nome, email, senha } = req.body;
    const usuarioId = req.session.usuario.id;
    
    let query = 'UPDATE usuarios SET nome = ?, email = ?';
    let params = [nome, email];

    try {
        if (senha && senha.trim() !== '') {
            const hash = await bcrypt.hash(senha, 10);
            query += ', senha = ?';
            params.push(hash);
        }

        if (req.file) {
            const fotoUrl = 'uploads/perfis/' + req.file.filename;
            query += ', foto = ?';
            params.push(fotoUrl);
            req.session.usuario.foto = fotoUrl;
        }

        query += ' WHERE id = ?';
        params.push(usuarioId);

        await db.query(query, params);
        
        req.session.usuario.nome = nome;
        req.session.usuario.email = email;

        req.session.toast = { msg: 'Perfil atualizado com sucesso!', tipo: 'success' };
        res.redirect('/configuracoes');
    } catch (error) {
        console.error(error);
        const msgErro = error.code === 'ER_DUP_ENTRY'
            ? 'Este e-mail já está em uso por outro usuário.'
            : 'Erro ao atualizar o perfil. Tente novamente.';
        req.session.toast = { msg: msgErro, tipo: 'danger' };
        res.redirect('/configuracoes');
    }
});

// ---------------------------------------------------------
// CRUD USUÁRIOS E BONIFICAÇÕES (SÓ ADMIN)
// ---------------------------------------------------------
router.post('/usuarios', verificarAdmin, async (req, res) => {
    const { nome, email, senha, perfil } = req.body;
    try {
        const hash = await bcrypt.hash(senha, 10);
        await db.query(
            'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, hash, perfil]
        );
        req.session.toast = { msg: `Usuário "${nome}" cadastrado com sucesso!`, tipo: 'success' };
        res.redirect('/configuracoes');
    } catch (error) {
        console.error(error);
        const msgErro = error.code === 'ER_DUP_ENTRY'
            ? 'Já existe um usuário cadastrado com este e-mail.'
            : 'Erro ao cadastrar o usuário.';
        req.session.toast = { msg: msgErro, tipo: 'danger' };
        res.redirect('/configuracoes');
    }
});

router.post('/usuarios/:id/editar', verificarAdmin, async (req, res) => {
    const { nome, email, senha, perfil } = req.body;
    try {
        let query = 'UPDATE usuarios SET nome = ?, email = ?, perfil = ?';
        let params = [nome, email, perfil];

        if (senha && senha.trim() !== '') {
            const hash = await bcrypt.hash(senha, 10);
            query += ', senha = ?';
            params.push(hash);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);
        
        await db.query(query, params);

        // Se o admin editou a própria conta pela tabela, mantém a sessão sincronizada
        if (parseInt(req.params.id) === req.session.usuario.id) {
            req.session.usuario.nome = nome;
            req.session.usuario.email = email;
            req.session.usuario.perfil = perfil;
        }

        req.session.toast = { msg: `Dados de "${nome}" atualizados com sucesso!`, tipo: 'success' };
        res.redirect('/configuracoes');
    } catch (error) {
        console.error(error);
        const msgErro = error.code === 'ER_DUP_ENTRY'
            ? 'Este e-mail já pertence a outro usuário.'
            : 'Erro ao atualizar os dados do usuário.';
        req.session.toast = { msg: msgErro, tipo: 'danger' };
        res.redirect('/configuracoes');
    }
});

router.post('/usuarios/:id/excluir', verificarAdmin, async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.session.usuario.id) {
            req.session.toast = { msg: 'Você não pode excluir sua própria conta.', tipo: 'danger' };
            return res.redirect('/configuracoes');
        }

        await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
        req.session.toast = { msg: 'Usuário excluído com sucesso.', tipo: 'success' };
        res.redirect('/configuracoes');
    } catch (error) {
        console.error(error);
        req.session.toast = {
            msg: 'Não é possível excluir um usuário que possui registros ou ideias vinculados.',
            tipo: 'danger'
        };
        res.redirect('/configuracoes');
    }
});

router.post('/bonificacoes', verificarAdmin, async (req, res) => {
    const { pontos_min, pontos_max, valor } = req.body;
    try {
        await db.query(
            'INSERT INTO regras_bonificacao (pontos_min, pontos_max, valor) VALUES (?, ?, ?)',
            [pontos_min, pontos_max, valor]
        );
        req.session.toast = { msg: 'Nova faixa de bonificação adicionada com sucesso!', tipo: 'success' };
        res.redirect('/configuracoes');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao adicionar a faixa de bonificação.', tipo: 'danger' };
        res.redirect('/configuracoes');
    }
});

router.post('/bonificacoes/:id/excluir', verificarAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM regras_bonificacao WHERE id = ?', [req.params.id]);
        req.session.toast = { msg: 'Faixa de bonificação excluída com sucesso.', tipo: 'success' };
        res.redirect('/configuracoes');
    } catch (error) {
        console.error(error);
        req.session.toast = { msg: 'Erro ao excluir a faixa de bonificação.', tipo: 'danger' };
        res.redirect('/configuracoes');
    }
});

module.exports = router;