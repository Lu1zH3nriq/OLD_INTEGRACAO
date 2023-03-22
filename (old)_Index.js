//importações
const express = require('express')
const axios = require('axios')
const mongoose = require('mongoose')
const Lancamento = require('./models/Lancamento')
const Usuario = require('./models/Usuario')
const app = express()

//fazer o app ler arquivos json
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//----------------------------rotas-----------------------------------------------

//getUsuario do portal para validar no ERP
app.post('/acessoERP', async (req, res) => {
  // objeto usuario com os dados recebidos do header da requisição
  const usuario = new Usuario(req.headers); 
  //Validação dos dados recebidos
  if (!req.headers.user || !req.headers.app || !req.headers.token) {
    res.status(422).json({ message: 'Preencha todos os campos'})
    return;
  }
  // Request da API do ERP
  try {
    const response = await axios.get('https://contaupcontabilidade.vendaerp.com.br/api/request/Lancamentos/GetAll', {
      headers: {
        'Authorization-Token': usuario.token,
        'User': usuario.user,
        'App': usuario.app,
        'Content-Type': 'application/json',
      }
    });
    if (response.status !== 200) {
      throw new Error(`Erro ao fazer request na API do ERP: ${response.status} ${response.statusText}`);
    }
    const data = response.data;
    res.status(200).json(data);


    // salvar o json no banco de dados


  } catch (error) {
    console.error(error);
    throw new Error(`Erro interno do servidor: ${error.message}`);
  }
});

//-------------------------------banco de dados MONGODB----------------------------------------
//entregar uma porta para o servidor e conectar ao banco de dados
const DB_User = 'admin' //usuario do banco de dados
const DB_Pass = encodeURIComponent('admin') //senha do usuario do banco de dados
mongoose.connect(`mongodb+srv://${DB_User}:${DB_Pass}@apicluster.pbksx7x.mongodb.net/db_test?retryWrites=true&w=majority`)
  .then(() => {
    console.log('Conectado!')
    app.listen(3000);
  })
  .catch((err) => console.log('Erro ao conectar: ' + err))

//-----------------------------------Comentários-----------------------------------------------------
/*


*/