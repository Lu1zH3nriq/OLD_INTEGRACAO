// cria a funçao que bsuca os lançamentos no erp de 10 em 10 min
//importações
const Usuario = require('./models/Usuario');
const axios = require('axios');
const mongoose = require('mongoose');
const LancamentoModel = require('./models/LancamentoModel');


// fução de buscar os usuarios cadastrados no banco de dados
async function buscaLancamentosERP() {
    try { // tenta buscar todos os usuarios no banco de dados
        const usuarios = await Usuario.find() // busca todos os usuarios no banco de dados
        for (let i = 0; i < usuarios.length; i++) { // percorre todos os usuarios
            try { // faze a requisição da api do erp para cada usuario
                const response = await axios.get('https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll', {
                    headers: {
                        'Authorization-Token': usuarios[i].token,
                        'User': usuarios[i].user,
                        'App': usuarios[i].app,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.status != 200) { // se a requisição não der certo
                    console.log('Erro ao requisitar a API do ERP');
                }


                const data = response.data;// json da resposta salvo em data

                // tenta salvar os lançamentos no banco de dados
               
                try {
                    // Conecta ao banco de dados
                    const DB_User = 'admin'; // usuário do banco de dados
                    const DB_Pass = encodeURIComponent('admin'); // senha do usuário do banco de dados
                    await mongoose.connect(`mongodb+srv://${DB_User}:${DB_Pass}@apicluster.pbksx7x.mongodb.net/?retryWrites=true&w=majority`);
                  
                    // Cria o array de documentos
                    const documents = [];
                    for (const lancamento of data) {
                      const lancamentoExistente = await LancamentoModel.findOne({ Codigo: lancamento.Codigo });
                      if (!lancamentoExistente) {
                        const novoLancamento = { ...lancamento, id_empresa: usuarios[i].id_empresa };
                        documents.push(novoLancamento);
                      }
                    }
                  
                    // Ordena o array de documentos pelo campo 'Codigo'
                    documents.sort((a, b) => a.Codigo - b.Codigo);
                  
                    // Salva os documentos no banco de dados
                    await LancamentoModel.insertMany(documents);
                    console.log(`${documents.length} lançamentos inseridos`);
                } catch (error) {
                    console.error(`Erro ao salvar lançamentos: ${error}`);
                }
                  
                //console.log(data);
            } catch (error) { // caso ocorra algum erro na requisição da API do ERP
                console.log(error)//mostra o erro
            }

        }// termina o for
    } catch (error) { // caso ocorra algum erro ao buscar os usuarios no banco de dados
        console.log(error);
    }
}



async function mostraLancamentos() {
    try {
        const lancamentos = await LancamentoModel.find();
        console.log(lancamentos);

    } catch (error) {
        console.log('Erro ao buscar lançamentos' + error);
    }
}


module.exports = buscaLancamentosERP;
//module.exports = mostraLancamentos;

    