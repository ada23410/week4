const express = require('express');
const router = express.Router();
const appError = require('../service/appError');
const handleErrorAsync = require('../service/handleErrorAsync');
const Post = require('../models/posts');
const User = require('../models/users');

/* GET */
router.get('/', handleErrorAsync(async function(req, res, next) {
    const timeSort = req.query.timeSort == "asc" ? "createdAt":"-createdAt"
    const q = req.query.q !== undefined ? {"content": new RegExp(req.query.q)} : {};

    const posts = await Post.find(q).populate({
        path: 'user',
        select: 'name photo '
    }).sort(timeSort);

    if(posts.length === 0){
        res.status(200).json({
            'status': 'success',
            'message': '目前尚無狀態，新增一則貼文吧！',
            data: {
                posts: []
            }
        });
    }else{
        res.status(200).json({
            'status': 'success',
            data: {
                posts
            }
        }) // 方法會自動結束不用額外加上res.end
    }
}));

/* POST */
router.post('/', handleErrorAsync(async function(req, res, next) {
    const { user, content, tags, type, image } = req.body;

    if (content && content.trim() == '') {
        return next(appError(400, "你沒有填寫 content 資料"))
    }

    if(image && !image.startsWith('https://')){
        return next(appError(400, "圖片網址必須以https開頭"))
    }

    const newPost = await Post.create({
        user: user,
        content: content.trim(),
        image: image,
        tags: tags,
        type: type
    });
    
    res.status(200).json({
        message: '新增成功',
        posts: newPost
    });
}));

/* DELETE */
router.delete('/', handleErrorAsync(async function(req, res, next) {
    await Post.deleteMany({});
    res.status(200).json({
        'status': 'success',
        data: []
    })
}));

/* DELETE only one*/
router.delete('/:id', handleErrorAsync(async function(req, res, next) {
    const { id } = req.params;

    const deletePost = await Post.findByIdAndDelete(id);

    if(!deletePost) {
        return next(appError(404, "找不到指定ID的貼文"));
    }

    res.status(200).json({
        'status': 'success',
        data: null
    })
}));

/* PATCH only one*/
router.patch('/:id', handleErrorAsync(async function(req, res, next) {
    const { id } = req.params;
    const { user, content, tags, type } = req.body;
    const posts = await Post.findByIdAndUpdate({_id: id}, { user, content, tags, type }, { new: true });

    if(! posts) {
        return next(appError(404, "找不到指定ID的貼文"));
    }
    
    res.status(200).json({
        'status': 'success',
        'data': posts
    })
}));


module.exports = router;
