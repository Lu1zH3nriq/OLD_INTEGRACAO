const router = require('express').Router();
const LancamentoModel = require('./models/LancamentoModel');
const Empresa = require('./models/EmpresaModel');
const mongoose = require('mongoose');

//------------------------------------rota portal para o erp -----------------------------------

router.post('/', async (req, res) => {
  //recebe os dados do usuario/empresa via header da request
  const empresa = new Empresa(req.headers)
  //verifica se os dados nao estao vazios
  if (!req.headers.user || !req.headers.app || !req.headers.token ||
    !req.headers.id_empresa) {
    res.status(202).json({ message: 'Existe algum campo vazio! ' })
  }
  //tenta salvar o usuario/empresa
  try {
    //verifica se o usuario ja existe cadastrado
    const empresaExistente = await Empresa.findOne({ token: empresa.token })
    if (empresaExistente) {
      console.log('empresa ja cadastrada!')
    }
    else {
      await Empresa.create(empresa)
      console.log('empresa cadastrada!')
    }
    try {
      const response = await axios.get('https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll', {
        headers: {
          'Authorization-Token': empresa[i].token,
          'User': empresa[i].user,
          'App': empresa[i].app,
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
          const novoLancamento = { ...lancamento, id_empresa: empresa.id_empresa };
          lancamentosParaSalvar.push(novoLancamento);
        } else {
          // Se o lançamento já existe no banco de dados, verifica se a data da última alteração é diferente
          if (lancamentoExistente.UltimaAlteracao !== lancamento.UltimaAlteracao) {
            // Se a data for diferente, atualiza o lançamento existente
            await LancamentoModel.updateOne({ Codigo: lancamento.Codigo }, { $set: { ...lancamento, id_empresa: empresa.id_empresa } });
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

  } catch (error) {
    res.status(500).json({ message: 'Erro solicitar atualização de lançamentos ' + error })
  }
})

/*router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find()
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar os usuarios' + error })
  }
})
*/


router.get('/buscaLancamentos', async (req, res) => {
  const cod_ult_lanc = req.headers.cod_ult_lanc;
  const DB_User = 'admin'; // usuário do banco de dados
  const DB_Pass = encodeURIComponent('admin'); // senha do usuário do banco de dados

  mongoose.connect(`mongodb+srv://${DB_User}:${DB_Pass}@apicluster.pbksx7x.mongodb.net/?retryWrites=true&w=majority`);
  
  try {
    const lancamentos = await LancamentoModel.find({ id_empresa: req.headers.id_empresa, Codigo: { $gt: cod_ult_lanc } }).sort({ codigo: 'asc' });

    if (lancamentos.length > 0) {
      res.status(200).json(lancamentos);
    } else {
      res.status(202).json({ message: 'Lançamentos ja estão atualizados' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar os lançamentos' + error });
  }
});


module.exports = router;