const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/mini_socialmedia_app')

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    password: String,
    email: String,
    post : [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }
  ]
})

module.exports = mongoose.model('user', userSchema);