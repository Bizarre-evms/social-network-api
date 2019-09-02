const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    privacy: {
        type: String,
        enum: ['ALL', 'FRIENDS', 'ONLYME'],
        default: 'ALL'
    },
    likes: {
        type: Number,
        default: 0
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Post = mongoose.model('Post', postSchema)
module.exports = Post