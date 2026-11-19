// Arquivo: services/indicadoresService.js
module.exports = {
    processarMes: function(registros) {
        let totalConsolidado = 0;
        let analiseCategorias = [];

        const grupos = {
            'Post': [], 'Carrossel': [], 'Stories': [], 'Reels': [],
            'Arte Fantasia': [], 'Arte de Cliente': [], 'Clichê': []
        };

        registros.forEach(r => {
            if ((r.status === 'aprovado' || r.status === 'pendente') && grupos[r.tipo]) {
                grupos[r.tipo].push(r);
            }
        });

        for (let tipo in grupos) {
            let regs = grupos[tipo];
            if (regs.length === 0) continue;

            let somaAlt = regs.reduce((acc, curr) => acc + parseInt(curr.qtd_alteracoes || 0), 0);
            let mediaExata = somaAlt / regs.length; // Média real sem arredondamento
            let mediaExibicao = Number(mediaExata.toFixed(1)); // Apenas para exibição (ex: 2.5)
            let mediaRegra = Math.floor(mediaExata); // Para as regras das demais categorias
            
            let metadinha = regs.length / 2; // > 50% = Maioria

            let ptsCategoria = 0;
            let statusMsg = '';
            
            // Variáveis ricas exclusivas para Arte de Cliente
            let perc24h, perc48h, justificativa;

            if (['Post', 'Carrossel', 'Stories', 'Reels'].includes(tipo)) {
                if (mediaRegra === 0) ptsCategoria = 30;
                else if (mediaRegra === 1) ptsCategoria = 20;
                else if (mediaRegra === 2) ptsCategoria = 15;
                else if (mediaRegra === 3) ptsCategoria = 10;
                else ptsCategoria = 5;

                let maxTempo = tipo === 'Carrossel' ? 120 : 30;
                let noPrazo = regs.filter(r => parseInt(r.tempo_producao_minutos || 0) <= maxTempo).length;
                
                if (noPrazo > metadinha) {
                    statusMsg = `Maioria no prazo. `;
                } else {
                    ptsCategoria -= 5;
                    statusMsg = `Maioria ultrapassou o tempo (${maxTempo} min). `;
                }
                statusMsg += `Média de alt: ${mediaExibicao}`;
            } 
            else if (tipo === 'Arte Fantasia') {
                if (mediaRegra === 0) ptsCategoria = 40;
                else if (mediaRegra === 1) ptsCategoria = 30;
                else if (mediaRegra === 2) ptsCategoria = 20;
                else if (mediaRegra === 3) ptsCategoria = 10;
                else ptsCategoria = 5;
                
                statusMsg = `Média de alt: ${mediaExibicao}`;
            } 
            else if (tipo === 'Arte de Cliente') {
                // Cálculo de Prazos (+48h engloba os de +24h naturalmente na contagem)
                let ate24h = regs.filter(r => parseInt(r.qtd_dias || 24) <= 24).length;
                let ate48h = regs.filter(r => parseInt(r.qtd_dias || 48) <= 48).length; 
                
                perc24h = (ate24h / regs.length) * 100;
                perc48h = (ate48h / regs.length) * 100;
                
                let maioria24h = ate24h > metadinha;
                let maioria48h = ate48h > metadinha;
                
                // Avaliação rigorosa da maior para a menor pontuação baseada na média exata e maioria
                if (maioria24h && mediaExata === 0) {
                    ptsCategoria = 50;
                    justificativa = 'Maioria entregue em até 24h e média exata de 0 alterações.';
                } else if (maioria48h && mediaExata === 0) {
                    ptsCategoria = 40;
                    justificativa = 'Maioria entregue em até 48h e média exata de 0 alterações.';
                } else if (maioria24h && mediaExata <= 1) {
                    ptsCategoria = 35;
                    justificativa = 'Maioria entregue em até 24h e média de até 1 alteração.';
                } else if (maioria48h && mediaExata <= 2) {
                    ptsCategoria = 30;
                    justificativa = 'Maioria entregue em até 48h e média de até 2 alterações.';
                } else if (maioria48h && mediaExata <= 3) {
                    ptsCategoria = 25;
                    justificativa = 'Maioria entregue em até 48h e média de até 3 alterações.';
                } else {
                    ptsCategoria = 0;
                    justificativa = 'Requisitos mínimos não atingidos (Média > 3 ou maioria > 48h).';
                }

                // Define a mensagem concatenada para alimentar perfeitamente o Relatório Excel
                statusMsg = `${justificativa} (Média: ${mediaExibicao} | <=24h: ${perc24h.toFixed(0)}% | <=48h: ${perc48h.toFixed(0)}%)`;
            }
            else if (tipo === 'Clichê') {
                let noPrazo = regs.filter(r => parseInt(r.qtd_dias || 0) < 10).length;
                let noLimite = regs.filter(r => parseInt(r.qtd_dias || 0) === 10).length;
                
                if (noPrazo > metadinha) {
                    ptsCategoria = 50;
                    statusMsg = 'Maioria recebida em menos de 10 dias.';
                } else if ((noPrazo + noLimite) > metadinha) {
                    ptsCategoria = 30;
                    statusMsg = 'Maioria recebida em exatos 10 dias.';
                } else {
                    ptsCategoria = 0;
                    statusMsg = 'Maioria ultrapassou 10 dias (0 pontos).';
                }
            }

            ptsCategoria = Math.max(0, ptsCategoria);
            totalConsolidado += ptsCategoria;

            analiseCategorias.push({
                tipo: tipo,
                qtdRegistros: regs.length,
                pontos: ptsCategoria,
                mensagem: statusMsg,
                // Dados injetados exclusivamente para turbinar o Layout HTML de Arte de Cliente
                isArteCliente: tipo === 'Arte de Cliente',
                mediaAlt: mediaExibicao,
                perc24h: perc24h ? perc24h.toFixed(0) : 0,
                perc48h: perc48h ? perc48h.toFixed(0) : 0,
                justificativa: justificativa
            });
        }

        return { totalConsolidado, analiseCategorias };
    }
};