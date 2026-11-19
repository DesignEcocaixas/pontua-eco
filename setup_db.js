// Arquivo: setup_db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function runSetup() {
    try {
        console.log('Conectando ao MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || ''
        });

        console.log('Criando banco de dados pontua_eco...');
        await connection.query('CREATE DATABASE IF NOT EXISTS pontua_eco CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        await connection.query('USE pontua_eco;');

        console.log('Criando tabelas...');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                perfil ENUM('admin', 'usuario') DEFAULT 'usuario',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS meses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(20) NOT NULL,
                ano INT NOT NULL,
                meta_pontos INT DEFAULT 0,
                status ENUM('aberto', 'finalizado') DEFAULT 'aberto',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS regras_bonificacao (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pontos_min INT NOT NULL,
                pontos_max INT NOT NULL,
                valor DECIMAL(10,2) NOT NULL
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS regras_pontuacao (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(50) NOT NULL,
                condicao_campo VARCHAR(50),
                condicao_min INT,
                condicao_max INT,
                pontos INT NOT NULL
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS registros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mes_id INT NOT NULL,
                usuario_id INT NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                cliente VARCHAR(150),
                post VARCHAR(150),
                reels VARCHAR(150),
                descricao TEXT,
                data_inicial DATETIME,
                data_entrega DATETIME,
                qtd_dias INT DEFAULT 0,
                tempo_producao_minutos INT DEFAULT 0,
                qtd_alteracoes INT DEFAULT 0,
                qtd_produzida INT DEFAULT 1,
                status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
                observacoes TEXT,
                pontos_calculados INT DEFAULT 0,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mes_id) REFERENCES meses(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ideias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                mes_id INT NOT NULL,
                titulo VARCHAR(150) NOT NULL,
                descricao TEXT NOT NULL,
                status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
                pontos_bonus INT DEFAULT 0,
                data DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
                FOREIGN KEY (mes_id) REFERENCES meses(id) ON DELETE CASCADE
            );
        `);

        // Inserir Admin Padrão
        const [usuarios] = await connection.query('SELECT * FROM usuarios WHERE email = "admin@ecocaixas.com.br"');
        if (usuarios.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await connection.query(
                'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', 
                ['Administrador', 'admin@ecocaixas.com.br', hash, 'admin']
            );
            console.log('✅ Usuário admin criado com sucesso (Login: admin@ecocaixas.com.br | Senha: admin123)');
        }

        // Inserir Regras Iniciais de Bonificação
        const [regras] = await connection.query('SELECT * FROM regras_bonificacao');
        if (regras.length === 0) {
            await connection.query(`
                INSERT INTO regras_bonificacao (pontos_min, pontos_max, valor) VALUES 
                (60, 89, 200.00), (90, 129, 300.00), (130, 169, 400.00), (170, 9999, 600.00)
            `);
            console.log('✅ Regras de bonificação inseridas.');
        }

        console.log('🚀 Setup do banco concluído com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao criar o banco:', error);
        process.exit(1);
    }
}

runSetup();