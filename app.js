//importações
const express = require('express')
const mongoose = require('mongoose')
//const Usuario = require('./models/Usuario')
const app = express()
const portal = require('./portal')
//const erpFunction = require('./erp')


//fazer o app ler arquivos json
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.listen(3000);

// ------------------------------CHAMA ROTA DO PORTAL----------------------------------------------------------------

app.get('/', portal)



//-----------------------------------Comentários-----------------------------------------------------
/*


*/
