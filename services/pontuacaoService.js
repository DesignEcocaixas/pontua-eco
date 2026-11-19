// Arquivo: services/pontuacaoService.js

module.exports = {
    calcularPontos: function (tipo, dados) {
        let pontos = 0;
        const alt = parseInt(dados.qtd_alteracoes) || 0;
        
        switch (tipo) {
            case 'Post':
            case 'Carrossel':
            case 'Stories':
            case 'Reels':
                if (alt === 0) pontos = 30;
                else if (alt === 1) pontos = 20;
                else if (alt === 2) pontos = 15;
                else if (alt === 3) pontos = 10;
                else pontos = 5;

                const tempo = parseInt(dados.tempo_producao_minutos) || 0;
                // Penalidade por tempo
                if (tipo === 'Post' && tempo > 30) pontos -= 5;
                if (tipo === 'Carrossel' && tempo > 120) pontos -= 5;
                break;

            case 'Arte Fantasia':
                if (alt === 0) pontos = 40;
                else if (alt === 1) pontos = 30;
                else if (alt === 2) pontos = 20;
                else if (alt === 3) pontos = 10;
                else pontos = 5;
                break;

            case 'Arte de Cliente':
                // Para simplificar no backend, recebemos o prazo em horas via frontend
                const prazoHoras = parseInt(dados.prazo_horas) || 24; 
                
                if (prazoHoras <= 24) {
                    if (alt === 0) pontos = 50;
                    else if (alt === 1) pontos = 35;
                    else pontos = Math.max(30 - ((alt - 2) * 5), 5); // Decresce de 5 em 5 até 5 pts
                } else if (prazoHoras <= 48) {
                    if (alt === 0) pontos = 40;
                    else if (alt === 1) pontos = 30;
                    else pontos = Math.max(25 - ((alt - 2) * 5), 5);
                } else {
                    pontos = 0; // Após 48h
                }
                break;

            case 'Clichê':
                const dias = parseInt(dados.qtd_dias) || 0;
                if (dias < 10) pontos = 50;
                else if (dias === 10) pontos = 30;
                else pontos = 0;
                break;

            case 'Nova Ideia':
                pontos = 0; // Definido posteriormente por um Admin
                break;
        }

        // Multiplicar pela quantidade produzida, caso exista esse conceito no tipo
        const qtdProduzida = parseInt(dados.qtd_produzida) || 1;
        pontos = pontos * qtdProduzida;

        return Math.max(pontos, 0); // Evitar pontos negativos (exceto se a regra de penalidade for dura, ajustável depois)
    }
};