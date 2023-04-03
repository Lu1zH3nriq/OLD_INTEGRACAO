const mongoose = require("mongoose");
require("dotenv").config();
//-----------------------CONEXAO COM O BANCO DE DADOS MONGODB----------------------------------------
//entregar uma porta para o servidor e conectar ao banco de dados
//const DB_User = process.env.USER_DB //usuario do banco de dados
//const DB_Pass = process.env.PASSWORD_DB //senha do usuario do banco de dados
mongoose
  .connect("mongodb://127.0.0.1:27017/integracao_portal_erp")
  .then(() => {
    console.log("Conectado!");
  })
  .catch((err) => console.log("Erro ao conectar: " + err));
