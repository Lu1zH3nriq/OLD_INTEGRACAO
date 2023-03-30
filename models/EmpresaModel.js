const mongoose = require('mongoose')

const Empresa = mongoose.model('Empresa', {
    user: String,
    app: String,
    token: String,
    id_empresa: String,
    UltimaConsulta: String,
})

module.exports = Empresa