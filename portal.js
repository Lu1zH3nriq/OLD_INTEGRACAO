const router = require('express').Router();
const LancamentoModel = require('./models/LancamentoModel');
const Empresa = require('./models/EmpresaModel');
const axios = require('axios');
const mongoose = require('mongoose');




//------------------------------------rota portal para o erp -----------------------------------

router.get('/', async (req, res) => {
  try {
    //-----------------------CONEXAO COM O BANCO DE DADOS MONGODB----------------------------------------
    //entregar uma porta para o servidor e conectar ao banco de dados
    const DB_User = 'admin' //usuario do banco de dados
    const DB_Pass = encodeURIComponent('admin') //senha do usuario do banco de dados
    mongoose.connect(`mongodb+srv://${DB_User}:${DB_Pass}@apicluster.pbksx7x.mongodb.net/?retryWrites=true&w=majority`)
      .then(() => {
        console.log('Conectado!')
      })
      .catch((err) => console.log('Erro ao conectar: ' + err))


    // Recebe os dados da empresa via header da request e query
    const empresa = new Empresa(req.headers);
    const pageSize = req.query.pageSize;

    // Verifica se os dados não estão vazios
    if (!empresa.user || !empresa.app || !empresa.token || !empresa.id_empresa) {
      return res.status(202).json({ message: 'Existe algum campo vazio!' });
    }

    // Verifica se a empresa já existe cadastrada
    let empresaExistente = await Empresa.findOne({ token: empresa.token });
    if (!empresaExistente) {
      // Caso não exista, cadastra a empresa no banco de dados
      empresaExistente = await Empresa.create(empresa);
    }

    // Faz a requisição da API do ERP
    let lancamentoExistente;
    let pageSizeAux = pageSize;
    do {
      const response = await axios.get('https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll', {
        params: {
          pageSize: pageSizeAux,
        },
        headers: {
          'Authorization-Token': empresaExistente.token,
          'User': empresaExistente.user,
          'App': empresaExistente.app,
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      const lancamentosParaSalvar = [];
      
      const jsonERP = [];

      // Reorganiza o json retornado da api com data de alteração decrescente 
      for (const lancamento of data) {
        lancamento.UltimaAlteracao = new Date(lancamento.UltimaAlteracao);
        jsonERP.push(lancamento);
      }
      jsonERP.sort((a, b) => b.UltimaAlteracao - a.UltimaAlteracao);

      for (const lanc of jsonERP) {
        const lancamentoExiste = await LancamentoModel.findOne({ Codigo: lanc.Codigo })
        if (!lancamentoExiste) {
          lancamentosParaSalvar.push(lanc);
        }
        if (lancamentoExiste) {
          lancamentoExistente = lancamentoExiste;
          break;
        }
      }
      
      
      LancamentoModel.insertMany(lancamentosParaSalvar)


      
      // ERRO ESTÁ AQUI .........................................................
      pageSizeAux = data.length;
      pageSize += pageSizeAux;
    } while (!lancamentoExistente);


    res.status(200).json({message: 'deu certo'})

  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar lançamentos' });
  }

  mongoose.disconnect();
});


module.exports = router;