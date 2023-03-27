const router = require('express').Router();
const LancamentoModel = require('./models/LancamentoModel');
const Empresa = require('./models/EmpresaModel');
const mongoose = require('mongoose');

//------------------------------------rota portal para o erp -----------------------------------

router.get('/', async (req, res) => {
  try {
    // Recebe os dados da empresa via header da request
    const empresa = new Empresa(req.headers);

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
    const response = await axios.get('https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll', {
      headers: {
        'Authorization-Token': empresaExistente.token,
        'User': empresaExistente.user,
        'App': empresaExistente.app,
        'Content-Type': 'application/json',
      }
    });

    if (response.status !== 200) {
      return res.status(202).json({ message: 'Erro ao solicitar API do ERP' });
    }

    const data = response.data;
    const lancamentosParaSalvar = [];

    // Interação sobre os lançamentos retornados pela API
    for (const lancamento of data) {
      const lancamentoExistente = await LancamentoModel.findOne({ Codigo: lancamento.Codigo });

      if (!lancamentoExistente) {
        // Se o lançamento não existe no banco de dados, adiciona na lista de lançamentos para salvar
        const novoLancamento = { ...lancamento, id_empresa: empresaExistente.id_empresa };
        lancamentosParaSalvar.push(novoLancamento);
      } else {
        // Se o lançamento já existe no banco de dados, verifica se a data da última alteração é diferente
        if (lancamentoExistente.UltimaAlteracao !== lancamento.UltimaAlteracao) {
          // Se a data for diferente, atualiza o lançamento existente
          await LancamentoModel.updateOne({ Codigo: lancamento.Codigo }, { $set: { ...lancamento, id_empresa: empresaExistente.id_empresa } });
        }
      }
    }

    // Insere os novos lançamentos no banco de dados
    if (lancamentosParaSalvar.length > 0) {
      await LancamentoModel.insertMany(lancamentosParaSalvar);
    }

    // Busca todos os lançamentos da empresa no banco de dados e retorna na response
    const lancamentos = await LancamentoModel.find({ id_empresa: empresaExistente.id_empresa });
    return res.status(200).json({ lancamentos });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Erro ao solicitar atualização de lançamentos' });
  }
});


module.exports = router;