const router = require('express').Router();
const LancamentoModel = require('./models/LancamentoModel');
const Usuario = require('./models/Usuario');
const mongoose = require('mongoose');

//-------------------------SALVA O USUARIO DO PORTAL NO MONGODB------------------------------------------//
//rota do portal
router.post('/salvaUsuario', async (req, res) => {
  //instancia novo usuario com os dados da requisição
  const usuario = new Usuario(req.headers)
  //verifica se os dados nao estao vazios
  if (!req.headers.user || !req.headers.app || !req.headers.token ||
    !req.headers.id_empresa) {
    res.status(200).json({ message: 'Existe algum campo vazio! ' })
  }
  //tenta salvar o usuario
  try {
    //verifica se o usuario ja existe cadastrado
    const usuarioExistente = await Usuario.findOne({ token: usuario.token })
    if (usuarioExistente) {
      res.status(200).json({ message: 'Usuário já cadastrado com esse token' })
    }
    else {
      //const usuarioSalo = await Usuario.find().pretty()
      await Usuario.create(usuario)
      res.status(200).json({ message: 'Usuário salvo com sucesso' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar o usuario ' + error })
  }
})

router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find()
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar os usuarios' + error })
  }
})


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
      res.status(200).json({ message: 'Lançamentos ja estão atualizados' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar os lançamentos' + error });
  }
});



module.exports = router;