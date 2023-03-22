const mongoose = require('mongoose')

const Usuario = mongoose.model('Usuario', {
    user: String,
    app: String,
    token: String,
    id_empresa: String,
})

module.exports = Usuario