const router = require("express").Router();
const LancamentoModel = require("./models/LancamentoModel");
const Empresa = require("./models/EmpresaModel");
const axios = require("axios");
const mongoose = require("mongoose");

//------------------------------------rota portal para o erp -----------------------------------

router.get("/", async (req, res) => {
  try {
    // Recebe os dados da empresa via header da request e query
    const empresa = new Empresa(req.headers);
    const pageSize = req.query.pageSize;

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
    const empresaExistente = await Empresa.findOne({ token: empresa.token });
    if (!empresaExistente) {
      // Caso não exista, cadastra a empresa no banco de dados
      empresaExistente = await Empresa.create(empresa);
    }

    // Faz a requisição da API do ERP
    let lancamentoExistente = {};
    let skip = 0;

    do {
      const response = await axios.get(
        "https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll",
        {
          params: {
            pageSize: pageSize,
            skip: skip,
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

      // Reorganiza o json retornado da api com data de alteração decrescente
      for (const lancamento of data) {
        lancamento.UltimaAlteracao = new Date(lancamento.UltimaAlteracao);
        jsonERP.push(lancamento);
      }
      jsonERP.sort(
        (a, b) => b.UltimaAlteracao.getTime() - a.UltimaAlteracao.getTime()
      );

      //verifica cada lancamento dentro do json se ja existe no banco de dados
      for (const lanc of jsonERP) {
        const lancamentoExiste = await LancamentoModel.findOne({
          Codigo: lanc.Codigo,
        });

        // se nao encontrar, cria os novos lancamentos
        if (!lancamentoExiste) {
          lancamentosParaSalvar.push(lanc);
        }

        // se ecnontrar termina a execução, ou seja, o restante ja está no banco
        else {
          lancamentoExistente = lancamentoExiste;
          break;
        }

        LancamentoModel.insertMany(lancamentosParaSalvar);
      }
      //pula para a proxima pagina com novos lancamentos do erp
      skip = skip + pageSize;

    } while (!lancamentoExistente); //repete até achar um lancamento que ja esteja no banco

    // retorna que deu certo para o client
    res.status(200).json({ message: "Deu certo" });


  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar lançamentos" });
  }
});

module.exports = router;
