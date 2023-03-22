//importações
const express = require('express')
const mongoose = require('mongoose')
const Usuario = require('./models/Usuario')
const app = express()
const portal = require('./portal')
const erpFunction = require('./erp')


//fazer o app ler arquivos json
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// ------------------------------CHAMA ROTA DO PORTAL----------------------------------------------------------------
app.post('/salvaUsuario',portal)


app.get('/', portal)

erpFunction()




app.get('/buscaLancamentos', portal)

//-----------------------CONEXAO COM O BANCO DE DADOS MONGODB----------------------------------------
//entregar uma porta para o servidor e conectar ao banco de dados
const DB_User = 'admin' //usuario do banco de dados
const DB_Pass = encodeURIComponent('admin') //senha do usuario do banco de dados
mongoose.connect(`mongodb+srv://${DB_User}:${DB_Pass}@apicluster.pbksx7x.mongodb.net/?retryWrites=true&w=majority`)
  .then(() => {
    console.log('Conectado!')
    app.listen(3000);
  })
  .catch((err) => console.log('Erro ao conectar: ' + err))

//-----------------------------------Comentários-----------------------------------------------------
/*


*/
