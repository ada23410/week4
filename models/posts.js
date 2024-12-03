const mongoose = require('mongoose');
const transformId = require('../service/transformId');

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, '貼文姓名未填寫']
          },
          tags: [
            {
              type: String,
              required: [true, '貼文標籤 tags 為填寫']
            }
          ],
          type: {
            type: String,
            enum: ['group', 'person'],
            required: [true, '貼文類型 type 未填寫']
          },
          content: {
            type: String,
            required: [true, 'Content 未填寫']
          },
          image: {
            type:String,
            default:"" 
          },
          createdAt: {
            type: Date,
            default: Date.now,
            select: true
          },
          likes: [
            {
              user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
              },
              createdAt: {
                  type: Date,
                  default: Date.now,
              },
            },
          ],
          comments: {
            type: Number,
            default: 0
          }
    },
    {
        versionKey: false, // 去除資料庫欄位的__v
        toJSON: { 
          virtuals: true,
          transform: transformId
        },
        toObject: { 
          virtuals: true,
          transform: transformId
        }
    }
);

postSchema.virtual('commentsV', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id'
});
const Post = mongoose.model('Post', postSchema);

module.exports = Post;