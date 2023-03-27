// cria a funçao que bsuca os lançamentos no erp de 10 em 10 min
//importações
const Usuario = require('./models/Usuario');
const axios = require('axios');
const mongoose = require('mongoose');
const LancamentoModel = require('./models/LancamentoModel');


// fução de buscar os usuarios cadastrados no banco de dados

async function buscaLancamentosERP() {
    try {
      const usuarios = await Usuario.find();
      for (let i = 0; i < usuarios.length; i++) {
        try {
          const response = await axios.get('https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll', {
            headers: {
              'Authorization-Token': usuarios[i].token,
              'User': usuarios[i].user,
              'App': usuarios[i].app,
              'Content-Type': 'application/json',
            }
          });
  
          if (response.status != 200) {
            console.log('Erro ao requisitar a API do ERP');
          }
  
          const data = response.data;
          const lancamentosParaSalvar = [];
  
          // Interação sobre os lançamentos retornados pela API
          for (const lancamento of data) {
            const lancamentoExistente = await LancamentoModel.findOne({ Codigo: lancamento.Codigo });
  
            if (!lancamentoExistente) {
              // Se o lançamento não existe no banco de dados, adiciona na lista de lançamentos para salvar
              const novoLancamento = { ...lancamento, id_empresa: usuarios[i].id_empresa };
              lancamentosParaSalvar.push(novoLancamento);
            } else {
              // Se o lançamento já existe no banco de dados, verifica se a data da última alteração é diferente
              if (lancamentoExistente.UltimaAlteracao !== lancamento.UltimaAlteracao) {
                // Se a data for diferente, atualiza o lançamento existente
                await LancamentoModel.updateOne({ Codigo: lancamento.Codigo }, { $set: { ...lancamento, id_empresa: usuarios[i].id_empresa } });
              }
            }
          }
  
          // Insere os novos lançamentos no banco de dados
          if (lancamentosParaSalvar.length > 0) {
            await LancamentoModel.insertMany(lancamentosParaSalvar);
          }
          
        } catch (error) {
          console.log(error)
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  


/*async function mostraLancamentos() {
    try {
        const lancamentos = await LancamentoModel.find();
        console.log(lancamentos);

    } catch (error) {
        console.log('Erro ao buscar lançamentos' + error);
    }
}*/


module.exports = buscaLancamentosERP;
//module.exports = mostraLancamentos;
