const mongoose = require('mongoose');
const Post = require('../models/posts');
const transformId = require('../service/transformId');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, '請輸入您的名字']
        },
        email: {
            type: String,
            required: [true, '請輸入您的 Email'],
            unique: true,
            lowercase: true,
        },
        photo:  {
            type: String,
            default: '' // 可以設置一個默認的頭像 URL
        },
        sex: {
            type: String,
            enum: ['male','female','other'],
            default: 'other' 
        },
        password: {
            type: String,
            required: [true, '請輸入您的 密碼'],
            minlength: 8,
            select: false
        },
        createdAt: {
            type: Date,
            default: Date.now,
            select: false
        },
        followers: [
            {
                user: { 
                    type: mongoose.Schema.ObjectId, 
                    ref: 'User'
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        following: [
            {
                user: { 
                    type: mongoose.Schema.ObjectId,
                    ref: 'User'
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        likes: [
            {
                posts: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'Post',
                }
            },
        ],
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
        },
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;