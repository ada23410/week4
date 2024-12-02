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
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /* #swagger.parameters['timeSort'] = {
        in: 'query',
        description: '時間排序，asc 為遞增，desc 為遞減',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['q'] = {
        in: 'query',
        description: '搜尋關鍵字',
        required: false,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        schema: {
            "message": "string",
            "data": {
                "posts": [
                    {
                        "_id": "string",
                        "content": "string",
                        "user": {
                            "_id": "string",
                            "name": "string",
                            "photo": "string"
                        },
                        "commentsV": [
                            {
                                "_id": "string",
                                "comment": "string",
                                "user": {
                                    "_id": "string",
                                    "name": "string"
                                }
                            }
                        ],
                        "createdAt": "string",
                        "updatedAt": "string"
                    }
                ]
            }
        },
        description: "取得所有貼文成功"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */
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
router.get('/:id',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '取得單一貼文' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '貼文的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        schema: {
            "message": "string",
            "data": {
                "_id": "string",
                "content": "string",
                "user": {
                    "_id": "string",
                    "name": "string",
                    "photo": "string"
                },
                "commentsV": [
                    {
                        "_id": "string",
                        "comment": "string",
                        "user": {
                            "_id": "string",
                            "name": "string"
                        }
                    }
                ],
                "createdAt": "string",
                "updatedAt": "string"
            }
        },
        description: "取得單一貼文成功"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */          
    /* #swagger.responses[404] = {
        schema: {
            "error": "string"
        },
        description: "Not found. 找不到該貼文。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async(req, res, next) => {
    const id = req.params.id;
    const post = await Post.findById(id)
    .populate({
        path: 'user',
        select: 'name photo'
    }).populate({
        path: 'commentsV',
        select: 'comment user createdAt'
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
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: '新增貼文的資料',
          required: true,
          schema: {
              "content": "string",
              "tags": ["string"],
              "type": "string",
              "image": "string"
        }
    } */ 
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": {
                "posts": {
                    "_id": "string",
                    "content": "string",
                    "user": {
                        "_id": "string",
                        "name": "string",
                        "photo": "string"
                    },
                    "tags": ["string"],
                    "type": "string",
                    "image": "string",
                    "createdAt": "string",
                    "updatedAt": "string"
                }
            }
        },
        description: "新增成功"
    } */
    /* #swagger.responses[400] = {
        schema: {
            "error": "string"
        },
        description: "Bad request. 沒有填寫content資料或圖片網址格式不正確。"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */
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
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": []
        },
        description: "刪除所有貼文成功"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */
    handleErrorAsync(async function(req, res, next) {
    await Post.deleteMany({});
    appSuccess(res, 200, '刪除所有貼文成功', []);
}));

/* DELETE only one*/
router.delete('/post/:id',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '刪除單筆貼文' */
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '貼文的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string"
        },
        description: "刪除貼文成功"
    } */
    /* #swagger.responses[404] = {
        schema: {
            "error": "string"
        },
        description: "Not found. 找不到指定ID的貼文。"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */
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
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '貼文的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.parameters['obj'] = {
        in: 'body',
        description: '貼文的更新資料',
        required: true,
        schema: {
            "user": "string",
            "content": "string",
            "tags": ["string"],
            "type": "string"
        }
    } */
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": {
                "_id": "string",
                "content": "string",
                "user": {
                    "_id": "string",
                    "name": "string",
                    "photo": "string"
                },
                "tags": ["string"],
                "type": "string",
                "createdAt": "string",
                "updatedAt": "string"
            }
        },
        description: "更新貼文成功"
    } */
    /* #swagger.responses[400] = {
        schema: {
            "error": "string"
        },
        description: "Bad request. 沒有填寫content資料。"
    } */
    /* #swagger.responses[404] = {
        schema: {
            "error": "string"
        },
        description: "Not found. 找不到指定ID的貼文。"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */
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
router.post('/:id/likes',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '對貼文按讚' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '貼文的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[201] = { 
        schema: {
            "message": "string",
            "data": {
                "postId": "string",
                "userId": "string"
            }
        },
        description: "按讚成功"
    } */
    /* #swagger.responses[404] = {
        schema: {
            "error": "string"
        },
        description: "Not found. 找不到該貼文。"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async(req, res, next) => {
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
router.delete('/:id/likes',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '取消按讚' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '貼文的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": {
                "postId": "string",
                "userId": "string"
            }
        },
        description: "取消按讚成功"
    } */
    /* #swagger.responses[404] = {
        schema: {
            "error": "string"
        },
        description: "Not found. 找不到該貼文。"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async(req, res, next) => {
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
router.post('/:id/comment',
    /* 	#swagger.tags = ['Comment']
        #swagger.description = '新增留言' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '貼文的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.parameters['obj'] = {
        in: 'body',
        description: '留言的內容',
        required: true,
        schema: {
            "comment": "string"
        }
    } */
    /* #swagger.responses[201] = { 
        schema: {
            "message": "string",
            "data": {
                "_id": "string",
                "post": "string",
                "user": "string",
                "comment": "string",
                "createdAt": "string",
                "updatedAt": "string"
            }
        },
        description: "新增成功"
    } */
    /* #swagger.responses[400] = {
        schema: {
            "error": "string"
        },
        description: "Bad request. 留言內容不可為空。"
    } */
    /* #swagger.responses[401] = {
        schema: {
            "error": "string"
        },
        description: "Unauthorized. 無效或缺少token。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async(req, res, next) => {
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
    // 更新留言數量
    await Post.findByIdAndUpdate(post, { $inc: { comments: 1 } });
    appSuccess(res, 201, '新增成功', newComment);
}));

/* GET posts list*/
router.get('/user/:id',
    /* 	#swagger.tags = ['Post']
        #swagger.description = '獲取用戶貼文列表' */
    /* #swagger.parameters['id'] = {
        in: 'path',
        description: '用戶的ID',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": {
                "results": "number",
                "posts": [
                    {
                        "_id": "string",
                        "content": "string",
                        "user": {
                            "_id": "string",
                            "name": "string",
                            "photo": "string"
                        },
                        "comments": [
                            {
                                "_id": "string",
                                "comment": "string",
                                "user": {
                                    "_id": "string",
                                    "name": "string"
                                }
                            }
                        ],
                        "createdAt": "string",
                        "updatedAt": "string"
                    }
                ]
            }
        },
        description: "獲取用戶貼文列表成功"
    } */
    /* #swagger.responses[404] = {
        schema: {
            "error": "string"
        },
        description: "Not found. 找不到指定用戶的貼文。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    handleErrorAsync(async(req, res, next) => {
    const user = req.params.id;
    const posts = await Post.find({user}).populate({
        path: 'comments',
        select: 'comment user'
    });

    appSuccess(res, 200, 'success', { results: posts.length, posts })
}))

module.exports = router;
