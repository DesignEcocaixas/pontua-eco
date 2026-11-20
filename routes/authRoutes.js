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

function formatarDataCurta(rawDate) {
    if (!rawDate) return '';
    const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (isNaN(d.getTime())) return '';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return dia + '/' + mes;
}

function formatarDetalheItem(reg) {
    const alt = parseInt(reg.qtd_alteracoes || 0, 10);
    if (['Post', 'Carrossel', 'Stories', 'Reels'].includes(reg.tipo)) {
        return alt + ' alt • ' + (reg.tempo_producao_minutos || 0) + ' min';
    }
    if (reg.tipo === 'Arte Fantasia') {
        return alt + ' alt';
    }
    if (reg.tipo === 'Arte de Cliente') {
        const prazo = (reg.qtd_dias == 72 || reg.qtd_dias == 99) ? '+72h' : (reg.qtd_dias || 24) + 'h';
        return alt + ' alt • ' + prazo;
    }
    if (reg.tipo === 'Clichê') {
        return (reg.qtd_dias || 0) + ' dias';
    }
    return '';
}

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
        const [registros] = await db.query(
            'SELECT * FROM registros WHERE mes_id = ? ORDER BY id DESC',
            [mesSelecionado.id]
        );

        // 4. Processa o SLA (Maioria/Média) e anexa a lista de itens em cada categoria
        const analise = indicadoresService.processarMes(registros);
        let pontosTotais = analise.totalConsolidado;

        analise.analiseCategorias = analise.analiseCategorias.map(cat => {
            const itensCategoria = registros
                .filter(r => r.tipo === cat.tipo && (r.status === 'aprovado' || r.status === 'pendente'))
                .map(r => ({
                    titulo: (r.cliente && r.cliente.trim()) ? r.cliente.trim() : 'Sem título',
                    detalhe: formatarDetalheItem(r),
                    data: formatarDataCurta(r.created_at || r.data_criacao || r.data_registro || r.data)
                }));
            return { ...cat, itens: itensCategoria };
        });

        // 5. Busca e soma os pontos bônus das Ideias Aprovadas no mês selecionado
        const [ideiasAprovadas] = await db.query(
            'SELECT * FROM ideias WHERE mes_id = ? AND status = "aprovada" ORDER BY id DESC',
            [mesSelecionado.id]
        );
        let bonusIdeias = 0;
        ideiasAprovadas.forEach(ideia => {
            bonusIdeias += parseInt(ideia.pontos_bonus || 0, 10);
        });
        pontosTotais += bonusIdeias;

        if (bonusIdeias > 0) {
            analise.analiseCategorias.push({
                tipo: 'Ideias Aprovadas',
                qtdRegistros: ideiasAprovadas.length,
                pontos: bonusIdeias,
                mensagem: 'Pontos bônus concedidos via Banco de Ideias',
                itens: ideiasAprovadas.map(ideia => ({
                    titulo: ideia.titulo || 'Ideia sem título',
                    detalhe: '+' + parseInt(ideia.pontos_bonus || 0, 10) + ' pts',
                    data: formatarDataCurta(ideia.created_at || ideia.data_criacao || ideia.data)
                }))
            });
        }

        // 6. Calcula a Bonificação em Dinheiro
        const bonificacao = await bonificacaoService.calcularBonificacao(pontosTotais);

        // 7. Envia tudo para a View (incluindo a lista de meses e os itens das categorias)
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