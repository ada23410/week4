const express = require('express');
const router = express.Router();
const appError = require('../service/appError');
const appSuccess = require('../service/appSuccess');
const handleErrorAsync = require('../service/handleErrorAsync');
const Post = require('../models/posts');
const User = require('../models/users');
const Comment = require('../models/comments');
const {isAuth,generateSendJWT} = require('../service/auth');

/* GET all posts */
router.get('/',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '取得所有貼文' */
    isAuth, handleErrorAsync(async function(req, res, next) {
    const timeSort = req.query.timeSort == "asc" ? "createdAt":"-createdAt"
    const q = req.query.q !== undefined ? {"content": new RegExp(req.query.q)} : {};

    const posts = await Post.find(q).populate({
        path: 'user',
        select: 'name photo '
    }).populate({
        path: 'commentsV',
        select: 'comment user'
    }).sort(timeSort);

    if(posts.length === 0){
        appSuccess(res, 200, '目前尚無狀態，新增一則貼文吧！', { posts: [] });
    }else{
        appSuccess(res, 200, null, { posts });
    }
}));

/* GET one post */
router.get('/:id', isAuth, handleErrorAsync(async(req, res, next) => {
    const id = req.params.id;
    const post = await Post.findById(id).populate({
        path: 'user',
        select: 'name photo'
    }).populate({
        path: 'commentsV',
        select: 'comment user'
    });

    if (!post) {
        return next(appError(404, '找不到該貼文', next));
    }

    appSuccess(res, 200, 'success', post);
}));

/* POST only post*/
router.post('/',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '新增單筆貼文' */ 
    isAuth, handleErrorAsync(async function(req, res, next) {
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

/* DELETE all posts*/
router.delete('/posts',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '刪除所有貼文' */  
    handleErrorAsync(async function(req, res, next) {
    await Post.deleteMany({});
    appSuccess(res, 200, '刪除所有貼文成功', []);
}));

/* DELETE only one*/
router.delete('/post/:id',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '刪除單筆貼文' */  
    handleErrorAsync(async function(req, res, next) {
    const { id } = req.params;

    const deletePost = await Post.findByIdAndDelete(id);

    if(!deletePost) {
        return next(appError(404, "找不到指定ID的貼文"));
    }

    appSuccess(res, 200, '刪除貼文成功', null);
}));

/* PATCH only one*/
router.patch('/post/:id',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '修改單筆貼文' */  
    handleErrorAsync(async function(req, res, next) {
    const { id } = req.params;
    const { user, content, tags, type } = req.body;

    if (!content || content.trim() === '') {
        return next(appError(400, "你沒有填寫 content 資料"));
    }
    
    const posts = await Post.findByIdAndUpdate({_id: id}, { user, content, tags, type }, { new: true });

    if(! posts) {
        return next(appError(404, "找不到指定ID的貼文"));
    }
    
    appSuccess(res, 200, '更新貼文成功', post);
}));

/* POST in likes*/
router.post('/:id/likes', isAuth, handleErrorAsync(async(req, res, next) => {
    const _id = req.params.id;

        const post = await Post.findOneAndUpdate(
            { _id },
            { $addToSet: { likes: req.user.id } },
            { new: true } 
        );

        if (!post) {
            return next(appError(404, '找不到該貼文'));
        }

        appSuccess(res, 201, '按讚成功', { postId: _id, userId: req.user.id });
}));

/* POST in unlike*/
router.delete('/:id/likes', isAuth, handleErrorAsync(async(req, res, next) => {
    const _id = req.params.id;
    const post = await Post.findOneAndUpdate(
        { _id },
        { $addToSet: { likes: req.user.id } }
    );

    if (!post) {
        return next(appError(404, '找不到該貼文'));
    }

    appSuccess(res, 201, '取消按讚成功', { postId: _id, userId: req.user.id });
}));

/* POST in comment*/
router.post('/:id/comment', isAuth, handleErrorAsync(async(req, res, next) => {
    const user = req.user.id;
    const post = req.params.id;
    const { comment }= req.body;
    if (!comment || comment.trim() === '') {
        return next(appError(400, '留言內容不可為空'));
    }
    
    const newComment = await Comment.create({
        post,
        user,
        comment
    });
    appSuccess(res, 201, '新增成功', newComment);
}));

/* GET posts list*/
router.get('/user/:id', handleErrorAsync(async(req, res, next) => {
    const user = req.params.id;
    const posts = await Post.find({user}).populate({
        path: 'comments',
        select: 'comment user'
    });

    appSuccess(res, 200, 'success', { results: posts.length, posts })
}))

module.exports = router;
