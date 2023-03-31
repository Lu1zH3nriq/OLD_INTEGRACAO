const router = require("express").Router();
const LancamentoModel = require("./models/LancamentoModel");
const EmpresaModel = require("./models/EmpresaModel");
const axios = require("axios");

//------------------------------------rota portal para o erp -----------------------------------

router.get("/buscaERP", async (req, res) => {
  try {
    if (req.headers["authorization"] !== process.env.TOKEN_DE_ACESSO)
      return res.status(401).send();

    // Recebe os dados da empresa via header da request e query
    const empresa = new EmpresaModel(req.headers);

    // Verifica se os dados não estão vazios
    if (
      !empresa.user ||
      !empresa.app ||
      !empresa.token ||
      !empresa.id_empresa
    ) {
      return res
        .status(202)
        .json({
          message:
            "Verificação do cadastro da empresa com dados do ERO incompletos!",
        });
    }

    // Verifica se a empresa já existe cadastrada
    let empresaExistente = await EmpresaModel.findOne({
      token: empresa.token,
    });
    if (!empresaExistente) {
      // Caso não exista, cadastra a empresa no banco de dados
      empresaExistente = await EmpresaModel.create(empresa);
    }

    let dateTime = empresaExistente.UltimaConsulta;

    // Faz a requisição da API do ERP
    try {
      const response = await axios.get(
        "https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/Pesquisar",
        {
          params: {
            alteradoApos: dateTime,
          },
          headers: {
            "Authorization-Token": empresaExistente.token,
            User: empresaExistente.user,
            App: empresaExistente.app,
            "Content-Type": "application/json",
          },
        }
      ); //console.log(response.data)

      const jsonERP = response.data;

      // reorganizar o json retornado da API por data de UltimaAltercao
      jsonERP.sort(
        (a, b) => new Date(b.UltimaAlteracao) - new Date(a.UltimaAlteracao)
      );

      // Interromper execução se não houver nenhum novo lançamento
      if (jsonERP.length === 0) return res.status(204).send();

      //ultima consulta passa a ser a data do lancamento mais atual
      const ultimaConsulta = new Date(jsonERP[0].UltimaAlteracao);
      ultimaConsulta.setMilliseconds(ultimaConsulta.getMilliseconds() + 1);
      await EmpresaModel.updateOne({
        UltimaConsulta: ultimaConsulta.toISOString(),
      });

      const lancamentosParaSalvar = [];

      //verifica cada lancamento dentro do data se ja existe no banco de dados
      for (const lancamento of jsonERP) {
        lancamento.id_empresa = empresa.id_empresa;
        const lancamentoExiste = await LancamentoModel.findOne({
          Codigo: lancamento.Codigo,
        });
        //se nao existir adiciona na lista para salvar no banco de dados
        if (lancamentoExiste) {
          //se existir e a ultima alteracao for diferente, altera o lancamento no banco de dados
          await LancamentoModel.updateOne(
            { Codigo: lancamento.Codigo },
            lancamento
          );
        } else {
          // salva o novo lancamento
          lancamentosParaSalvar.push(await LancamentoModel.create(lancamento));
        }
      }

      //res.status(200).json(lancamentosParaSalvar);
      res.status(200).json({ message: "Lancamentos atualizados com sucesso!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao requisitar API do ERP " });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar lançamentos " });
  }
});


router.get("/buscaLancamentos", async (req, res) => {
  try {
    // recebe parametros da requisicao
    const id_empresa = req.headers.id_empresa;
    const pageSize = parseInt(req.query.pageSize); 
    const pageNumber = parseInt(req.query.pageNumber); 

    // calcula o valor do skip para pular os lancamentos ja retornados
    const skip = (pageNumber - 1) * pageSize;

    //calcula o total de lancamentos para a empresa passada via parametro da request
    const totalLancamentos = await LancamentoModel.countDocuments({
      id_empresa: id_empresa,
    });

    //calcula o total de paginas definido pelo pageSize recebido da request
    const totalPages = Math.ceil(totalLancamentos / pageSize);


    //faz a busca paginada no mongoDB de acordo com os parametros recebidos da request
    const lancamentosDoMongo = await LancamentoModel.find({
      id_empresa: id_empresa,
    }).skip(skip).limit(pageSize);


    //retorna ao client um json contendo as informações colhidas no banco de dados
    res.status(200).json({ totalPages, totalLancamentos, lancamentosDoMongo });


  } catch (error) {
    //console.log(error);
    res.status(500).json({ message: "erro ao buscar lancamentos" });
  }
});


  router.get('/totalLancamentos', async (req, res) => {
    try {
      const id_empresa = req.headers.id_empresa;
      const plano_de_conta = req.query.plano_de_conta;
      let resultado;

      if (plano_de_conta) {
        resultado = await LancamentoModel.aggregate([
          { $match: { id_empresa, plano_de_conta } },
          { $group: { _id: '$PlanoDeConta', total: { $sum: '$Valor' } } },
        ]).exec();
      } else {
        resultado = await LancamentoModel.aggregate([
          { $match: { id_empresa } },
          { $group: { _id: '$PlanoDeConta', total: { $sum: '$Valor' } } },
        ]).exec();
      }

      return res.status(200).json({resultado: resultado });
    } catch (err) {
      return res.status(500).json({ message: 'erro: ' + err });
    }
  })

module.exports = router;
