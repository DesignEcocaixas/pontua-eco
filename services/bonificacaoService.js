// Arquivo: services/bonificacaoService.js
const db = require('../db');

module.exports = {
    calcularBonificacao: async function(pontosTotais) {
        try {
            // Busca as regras cadastradas no banco
            const [faixas] = await db.query('SELECT * FROM regras_bonificacao ORDER BY pontos_min ASC');
            
            let valorAlcancado = 0;
            let proximaFaixa = null;
            let pontosFaltantes = 0;

            for (let i = 0; i < faixas.length; i++) {
                let faixa = faixas[i];
                
                if (pontosTotais >= faixa.pontos_min && pontosTotais <= faixa.pontos_max) {
                    valorAlcancado = parseFloat(faixa.valor);
                    // Define qual é a próxima meta para gamificação
                    if (i + 1 < faixas.length) {
                        proximaFaixa = faixas[i + 1];
                        pontosFaltantes = proximaFaixa.pontos_min - pontosTotais;
                    }
                } 
                // Caso não tenha atingido a primeira faixa ainda
                else if (pontosTotais < faixas[0].pontos_min && i === 0) {
                    proximaFaixa = faixa;
                    pontosFaltantes = proximaFaixa.pontos_min - pontosTotais;
                }
            }

            return {
                valor: valorAlcancado,
                proximaMeta: proximaFaixa ? parseFloat(proximaFaixa.valor) : null,
                pontosFaltantes: pontosFaltantes > 0 ? pontosFaltantes : 0
            };
        } catch (error) {
            console.error("Erro ao calcular bonificação:", error);
            return { valor: 0, proximaMeta: null, pontosFaltantes: 0 };
        }
    }
};