const router = require("express").Router();
const LancamentoModel = require("./models/LancamentoModel");
const EmpresaModel = require("./models/EmpresaModel");
const axios = require("axios");

//------------------------------------rota portal para o erp -----------------------------------

router.get("/", async (req, res) => {
  try {
    // Recebe os dados da empresa via header da request e query
    const empresa = new EmpresaModel(req.headers);

    // Verifica se os dados não estão vazios
    if (
      !empresa.user ||
      !empresa.app ||
      !empresa.token ||
      !empresa.id_empresa
    ) {
      return res.status(202).json({ message: "Existe algum campo vazio!" });
    }

    // Verifica se a empresa já existe cadastrada
    const empresaExistente = await EmpresaModel.findOne({
      token: empresa.token,
    });
    if (!empresaExistente) {
      // Caso não exista, cadastra a empresa no banco de dados
      empresaExistente = await EmpresaModel.create(empresa);
    }

    let dateTime = empresaExistente.UltimaConsulta;
    if (!dateTime) {
      dateTime = "2000-01-01T00:00:01.001-03:00";
    }

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
      );

      const data = response.data;
      const lancamentosParaSalvar = [];
      const jsonERP = [];

      // reorganizar o json retornado da API por data de UltimaAltercao
      for(const lanc of data){
        lanc.UltimaAlteracao = new Date(lanc.UltimaAlteracao);
        jsonERP.push(lanc);
      }
       jsonERP.sort((a, b) => b.UltimaAlteracao - a.UltimaAlteracao);

      
      //ultima consulta passa a ser a data do lancamento mais atual
      await EmpresaModel.updateOne({
        UltimaConsulta: jsonERP[0].UltimaAlteracao,
      });

      //verifica cada lancamento dentro do data se ja existe no banco de dados
      for (const lancamento of jsonERP) {
        const lancamentoExiste = await LancamentoModel.findOne({
          Codigo: lancamento.Codigo,
        });
        //se nao existir adiciona na lista para salvar no banco de dados
        if (!lancamentoExiste) {
          lancamentosParaSalvar.push(lancamento);
        } else {
          //se existir e a ultima alteracao for diferente, altera o lancamento no banco de dados
          if (lancamentoExiste.UltimaAlteracao !== lancamento.UltimaAlteracao) {
            await LancamentoModel.updateOne(
              { Codigo: lancamento.Codigo },
              lancamento
            );
          }
        }
      }

      //salva os novos lancamentos atualizados
      if (lancamentosParaSalvar.length > 0) {
        await LancamentoModel.create(lancamentosParaSalvar);
      }

      res.status(200).json(jsonERP);

      
    } catch (error) {
      res
        .status(404)
        .json({ message: "Erro ao requisitar API do ERP  :" + error });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erro ao atualizar lançamentos" + error });
  }
});

module.exports = router;
