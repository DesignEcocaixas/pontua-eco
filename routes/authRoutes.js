// Arquivo: routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { verificarAuth } = require('../middlewares/auth');

const renderLogin = require('../views/login');
const renderDashboard = require('../views/dashboard');

// Services importados para alimentar o Dashboard
const indicadoresService = require('../services/indicadoresService');
const bonificacaoService = require('../services/bonificacaoService');

const NOMES_MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

router.get('/login', (req, res) => {
    if (req.session.usuario) return res.redirect('/dashboard');
    res.send(renderLogin());
});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length > 0) {
            const usuario = rows[0];
            const match = await bcrypt.compare(senha, usuario.senha);
            if (match) {
                req.session.usuario = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil,
                    foto: usuario.foto
                };
                return res.redirect('/dashboard');
            }
        }
        res.send(renderLogin('E-mail ou senha incorretos.'));
    } catch (err) {
        console.error(err);
        res.send(renderLogin('Erro interno no servidor.'));
    }
});

router.get('/dashboard', verificarAuth, async (req, res) => {
    try {
        // 1. Busca todos os meses cadastrados para alimentar o <select>
        const [todosMeses] = await db.query('SELECT * FROM meses ORDER BY ano DESC, id DESC');

        if (todosMeses.length === 0) {
            return res.send(renderDashboard(req.session.usuario, null, 0, null, [], []));
        }

        // 2. Define qual mês será exibido (selecionado ou mês atual como padrão)
        const mesIdParam = req.query.mes_id ? parseInt(req.query.mes_id, 10) : null;
        let mesSelecionado = null;

        if (mesIdParam) {
            mesSelecionado = todosMeses.find(m => m.id === mesIdParam) || null;
        }

        if (!mesSelecionado) {
            const agora = new Date();
            const nomeMesAtual = NOMES_MESES[agora.getMonth()].toLowerCase();
            const anoAtual = agora.getFullYear();

            // Prioriza o mês/ano do calendário atual; depois o mais recente aberto; por fim o último cadastrado
            mesSelecionado =
                todosMeses.find(m => m.nome.toLowerCase() === nomeMesAtual && parseInt(m.ano, 10) === anoAtual) ||
                todosMeses.find(m => m.status === 'aberto') ||
                todosMeses[0];
        }

        // 3. Busca os registros do mês selecionado
        const [registros] = await db.query('SELECT * FROM registros WHERE mes_id = ?', [mesSelecionado.id]);

        // 4. Processa o SLA (Maioria/Média) para calcular a pontuação real
        const analise = indicadoresService.processarMes(registros);
        let pontosTotais = analise.totalConsolidado;

        // 5. Soma os pontos bônus das Ideias Aprovadas no mês selecionado
        const [ideias] = await db.query(
            'SELECT COUNT(*) as qtd, SUM(pontos_bonus) as total_bonus FROM ideias WHERE mes_id = ? AND status = "aprovada"',
            [mesSelecionado.id]
        );
        const bonusIdeias = parseInt(ideias[0].total_bonus || 0, 10);
        const qtdIdeias = parseInt(ideias[0].qtd || 0, 10);
        pontosTotais += bonusIdeias;

        if (bonusIdeias > 0) {
            analise.analiseCategorias.push({
                tipo: 'Ideias Aprovadas',
                qtdRegistros: qtdIdeias,
                pontos: bonusIdeias,
                mensagem: 'Pontos bônus concedidos via Banco de Ideias'
            });
        }

        // 6. Calcula a Bonificação em Dinheiro
        const bonificacao = await bonificacaoService.calcularBonificacao(pontosTotais);

        // 7. Envia tudo para a View (incluindo a lista de meses)
        res.send(renderDashboard(
            req.session.usuario,
            mesSelecionado,
            pontosTotais,
            bonificacao,
            analise.analiseCategorias,
            todosMeses
        ));
    } catch (error) {
        console.error(error);
        res.send(renderDashboard(req.session.usuario, null, 0, null, [], []));
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login?logout=1');
    });
});

module.exports = router;