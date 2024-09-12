const mongoose = require('mongoose');

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
        photo: String,
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
                user: { type: mongoose.Schema.ObjectId, ref: 'User'},
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        following: [
            {
                user: { type: mongoose.Schema.ObjectId, ref: 'User'},
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        versionKey: false // 去除資料庫欄位的__v
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;