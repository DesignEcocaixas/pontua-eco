// Arquivo: app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ESSENCIAL: Libera a pasta public para exibir as fotos de perfil e logos
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'eco_pontua_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Rotas
const authRoutes = require('./routes/authRoutes');
const mesesRoutes = require('./routes/mesesRoutes');
const ideiasRoutes = require('./routes/ideiasRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const configuracoesRoutes = require('./routes/configuracoesRoutes');

app.use('/', authRoutes);
app.use('/meses', mesesRoutes);
app.use('/ideias', ideiasRoutes);
app.use('/relatorios', relatoriosRoutes);
app.use('/configuracoes', configuracoesRoutes);

app.get('/', (req, res) => res.redirect('/login'));

app.listen(PORT, () => {
    console.log(`[Pontua Eco] Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});