const mongoose = require('mongoose')

const Empresa = mongoose.model('Empresa', {
    user: String,
    app: String,
    token: String,
    id_empresa: String,
})

module.exports = Empresa