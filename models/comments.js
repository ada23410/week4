const mongoose = require('mongoose');

const commentsSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            required: [true , '留言不能為空！']
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true , '用戶必須依據貼文']
        },
        post: {
            type: mongoose.Schema.ObjectId,
            ref: 'Post',
            required: [true , '留言必須依據貼文']
        }
    },
    {
        versionKey: false// 去除資料庫欄位的__v
    }
);

commentsSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name id createdAt photo'
    })

    next();
})

const Comment = mongoose.model('Comment', commentsSchema);
module.exports = Comment;