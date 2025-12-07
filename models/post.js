const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    user : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  postDate : {
    type: Date,
    default: Date.now
  },
  postContent : String,
  postImage : String,
  postLikes : [
    {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
  ]
})

module.exports = mongoose.model('post', postSchema);