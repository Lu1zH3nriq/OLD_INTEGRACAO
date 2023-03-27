const router = require('express').Router();
const LancamentoModel = require('./models/LancamentoModel');
const Empresa = require('./models/EmpresaModel');
const mongoose = require('mongoose');

//------------------------------------rota portal para o erp -----------------------------------

router.get('/', async (req, res) => {
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
      //res.status(202).json({ message: 'usuario ja cadastrado com este token!' })
    }
    else {
      await Empresa.create(empresa)
      //res.status(200).json({ message: 'empresa cadastrada com sucesso!' })
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
        res.status(202).json({message: 'erro ao solicitar api do erp'})
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

module.exports = router;