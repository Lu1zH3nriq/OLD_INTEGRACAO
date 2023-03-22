const mongoose = require('mongoose');

const PagamentoLancamento = new mongoose.Schema({
  Data: String,
  FormaPagamento: String,
  NumeroDocumento: String,
  ContaBancaria: String,
  Conciliado: Boolean,
  Valor: Number
});

const ParcelaLancamento = new mongoose.Schema({
  Codigo: Number,
  DataVencimento: String,
  Documento: String,
  ValorParcela: Number,
  Quitado: Boolean,
  DataQuitacao: String,
  ValorPago: Number
});

const Lancamento = new mongoose.Schema({
  id_empresa: String,
  Codigo: Number,
  UltimaAlteracao: String,
  DataCompetencia: String,
  DataVencimento: String,
  DataVencimentoOriginal: String,
  DataQuitacao: String,
  Empresa: String,
  Cliente: String,
  NumeroDocumento: String,
  Descricao: String,
  Observacoes: String,
  Quitado: Boolean,
  Conciliado: Boolean,
  EhDespesa: Boolean,
  PlanoDeConta: String,
  CentroDeCusto: String,
  ContaBancaria: String,
  FormaPagamento: String,
  LancamentoGrupo: String,
  Valor: Number,
  TotalRecebido: Number,
  Pagamentos: [PagamentoLancamento],
  NumeroBoleto: Number,
  NumeroNFSe: Number,
  CodigoVenda: Number,
  CodigoContrato: Number,
  Parcelas: [ParcelaLancamento],
  JurosPagamentos: Number,
  MultaPagamentos: Number
});

const LancamentoModel = mongoose.model('Lancamento', Lancamento);

module.exports = LancamentoModel;
