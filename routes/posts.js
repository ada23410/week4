const express = require('express');
const router = express.Router();
const appError = require('../service/appError');
const appSuccess = require('../service/appSuccess');
const handleErrorAsync = require('../service/handleErrorAsync');
const Post = require('../models/posts');
const User = require('../models/users');
const {isAuth,generateSendJWT} = require('../service/auth');

/* GET */
router.get('/', handleErrorAsync(async function(req, res, next) {
    const timeSort = req.query.timeSort == "asc" ? "createdAt":"-createdAt"
    const q = req.query.q !== undefined ? {"content": new RegExp(req.query.q)} : {};

    const posts = await Post.find(q).populate({
        path: 'user',
        select: 'name photo '
    }).sort(timeSort);

    if(posts.length === 0){
        appSuccess(res, 200, '目前尚無狀態，新增一則貼文吧！', { posts: [] });
    }else{
        appSuccess(res, 200, null, { posts });
    }
}));

/* POST */
router.post('/', isAuth, handleErrorAsync(async function(req, res, next) {
    const { user, content, tags, type, image } = req.body;

    if (content && content.trim() == '') {
        return next(appError(400, "你沒有填寫 content 資料"))
    }

    if(image && !image.startsWith('https://')){
        return next(appError(400, "圖片網址必須以https開頭"))
    }

    const newPost = await Post.create({
        user: req.user.id,
        content: content.trim(),
        image: image,
        tags: tags,
        type: type
    });
    
    appSuccess(res, 200, '新增成功', { posts: newPost });
}));

/* DELETE */
router.delete('/posts', handleErrorAsync(async function(req, res, next) {
    await Post.deleteMany({});
    appSuccess(res, 200, '刪除所有貼文成功', []);
}));

/* DELETE only one*/
router.delete('/post/:id', handleErrorAsync(async function(req, res, next) {
    const { id } = req.params;

    const deletePost = await Post.findByIdAndDelete(id);

    if(!deletePost) {
        return next(appError(404, "找不到指定ID的貼文"));
    }

    appSuccess(res, 200, '刪除貼文成功', null);
}));

/* PATCH only one*/
router.patch('/post/:id', handleErrorAsync(async function(req, res, next) {
    const { id } = req.params;
    const { user, content, tags, type } = req.body;
    const posts = await Post.findByIdAndUpdate({_id: id}, { user, content, tags, type }, { new: true });

    if(! posts) {
        return next(appError(404, "找不到指定ID的貼文"));
    }
    
    appSuccess(res, 200, '更新貼文成功', post);
}));


module.exports = router;
