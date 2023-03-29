const mongoose = require("mongoose")

//-----------------------CONEXAO COM O BANCO DE DADOS MONGODB----------------------------------------
//entregar uma porta para o servidor e conectar ao banco de dados
const DB_User = 'admin' //usuario do banco de dados
const DB_Pass = encodeURIComponent('admin') //senha do usuario do banco de dados
mongoose.connect(`mongodb+srv://${DB_User}:${DB_Pass}@apicluster.pbksx7x.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => {
        console.log('Conectado!')
    })
    .catch((err) => console.log('Erro ao conectar: ' + err))