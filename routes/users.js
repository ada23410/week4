const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const appError = require('../service/appError');
const Post = require('../models/posts');
const appSuccess = require('../service/appSuccess');
const handleErrorAsync = require('../service/handleErrorAsync');
const {isAuth,generateSendJWT} = require('../service/auth');
const app = require('../app');
const router = express.Router();

/* sign-up */
router.post('/sign_up',
    /* 	#swagger.tags = ['User']
        #swagger.description = '註冊功能' */
    /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: '註冊功能',
          required: true,
          schema: {
              "name": "username",
              "email": "user@example.com",
              "password": "yourpassword",
              "confirmPassword": "yourpassword"
        }
    } */ 
    /* #swagger.responses[201] = { 
        schema: {
            "id": "string",
            "name": "string",
            "email": "string",
            "createdAt": "string",
            "updatedAt": "string",
            "token": "string"
        },
        description: "User registered successfully." 
    } */
    /* #swagger.responses[400] = { 
        schema: {
            "error": "string"
        },
        description: "Bad request. Invalid input data." 
    } */
    /* #swagger.responses[500] = { 
        schema: {
            "error": "string"
        },
        description: "Internal server error." 
    } */
    handleErrorAsync(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    // 內容不可為空
    if (!name || !email || !password || !confirmPassword) {
        return next(appError(400, "欄位未填寫正確！"));
    }

    // 驗證密碼是否一致
    if (password !== confirmPassword) {
        return next(appError(400, "密碼不一致！"));
    }

    // 驗證密碼格式（至少8碼）
    if (!validator.isLength(password, { min: 8 })) {
        return next(appError(400, "密碼字數低於8碼"));
    }

     // 驗證密碼是否包含至少一個字母和一個數字
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return next(appError(400, "密碼需包含至少一個字母和一個數字"));
    }

    // 是否為email格式
    if (!validator.isEmail(email)) {
        return next(appError(400, "Email格式不正確"));
    }

    // 檢查電子郵件是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(appError(400, "會員已存在！"));
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword
    });

    generateSendJWT(newUser, 201, res);
}));

/* sign-up */
router.post('/sign_in',
    /* 	#swagger.tags = ['User']
        #swagger.description = '登入功能' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: '登入功能',
          required: true,
          schema: {
              "email": "user@example.com",
              "password": "password1234"
        }
    } */ 
    /* #swagger.responses[200] = { 
        schema: {
            "id": "string",
            "name": "string",
            "email": "string",
            "token": "string"
        },
        description: "User signed in successfully." 
    } */
    /* #swagger.responses[400] = { 
        schema: {
            "error": "string"
        },
        description: "Bad request. Invalid input data." 
    } */
    /* #swagger.responses[500] = { 
        schema: {
            "error": "string"
        },
        description: "Internal server error." 
    } */
    handleErrorAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 帳號密碼不可為空
    if (!email || !password) {
      return next(appError(400, "帳號密碼不可為空"));
    }

    // 驗證資料庫是否有此帳號，進而比對密碼
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(appError(400, '用戶不存在'));
    }
    const auth = await bcrypt.compare(password, user.password);

    if (!auth) {
      return next(appError(400, '你的密碼不正確'));
    }

    generateSendJWT(user, 200, res);
}));

/* profile */
router.get('/profile',
    /* 	#swagger.tags = ['User']
        #swagger.description = '檢視個人資料' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
  /* #swagger.responses[200] = { 
      schema: {
          "name": "string",
          "email": "string",
          "sex": "string"
      },
      description: "檢視個人資料成功！"
  } */
  /* #swagger.responses[401] = { 
      schema: {
          "error": "string"
      },
      description: "Unauthorized. Invalid or missing token."
  } */
  /* #swagger.responses[500] = { 
      schema: {
          "error": "string"
      },
      description: "Internal server error."
  } */
  isAuth, handleErrorAsync(async (req, res, next) => {
  appSuccess(res, 200, '檢視個人資料成功！', {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    sex: req.user.sex,
    photo: req.user.photo
  });
}));

/* update profile */
router.patch('/profile',
  /* 	#swagger.tags = ['User']
      #swagger.description = '編輯個人資料' */
     /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
  /*	#swagger.parameters['obj'] = {
        in: 'body',
        description: '編輯個人資料',
        required: true,
        schema: {
            "name": "string",
            "sex": "string",
            "photo": "string"
      }
  } */ 
  /* #swagger.responses[200] = { 
      schema: {
          "name": "string",
          "email": "string",
          "sex": "string",
          "photo": "string"
      },
      description: "更新個人資料成功！"
  } */
  /* #swagger.responses[400] = { 
      schema: {
          "error": "string"
      },
      description: "Bad request. 必須提供至少一個要更新的內容。"
  } */
  /* #swagger.responses[404] = { 
      schema: {
          "error": "string"
      },
      description: "Not found. 用戶不存在。"
  } */
  /* #swagger.responses[500] = { 
      schema: {
          "error": "string"
      },
      description: "Internal server error."
  } */  
  isAuth, handleErrorAsync(async (req, res, next) => {

  const { name, sex, photo } = req.body;

  // 檢查是否提供了name或sex
  if (!name && !sex && !photo) {
    return next(appError(400, '必須提供至少一個要更新的內容'));
  }

  // 更新用戶資料
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, sex, photo },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(appError(404, '用戶不存在'));
  }

  appSuccess(res, 200, '更新個人資料成功！', {
    name: updatedUser.name,
    email: updatedUser.email,
    sex: updatedUser.sex,
    photo: updatedUser.photo
  });
}));

/* Get other user's public profile */
router.get('/profile/:id',
    /*  #swagger.tags = ['User']
        #swagger.description = '獲取其他用戶的公開資料' */
       /* #swagger.security = [{
              "apiKeyAuth": []
      }] */
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
                "_id": "string",
                "name": "string",
                "photo": "string",
                "followersCount": "number",
                "followingCount": "number",
                "likes": [
                    {
                        "content": "string",
                        "image": "string",
                        "user": {
                            "name": "string",
                            "photo": "string"
                        }
                    }
                ]
            }
        },
        description: "獲取用戶公開資料成功"
    } */
    /* #swagger.responses[404] = { 
        schema: {
            "error": "string"
        },
        description: "用戶不存在"
    } */
    /* #swagger.responses[500] = { 
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async (req, res, next) => {
        const userId = req.params.id;
        console.log('Requested User ID:', req.params.id);

        // 查找目標用戶
        const user = await User.findById(userId)
            .populate({
                path: 'followers.user',
                select: 'name photo',
            })
            .populate({
                path: 'following.user',
                select: 'name photo',
            })
            .populate({
                path: 'likes.posts',
                select: 'user',
            })


        if (!user) {
            return next(appError(404, '用戶不存在'));
        }

        // 返回公開資料
        appSuccess(res, 200, 'success', {
            _id: user._id,
            name: user.name,
            photo: user.photo,
            followers: user.followers,
            following: user.following,
            likes: user.likes,
        });
    })
);

/* update password */
router.post('/updatePassword',
    /* 	#swagger.tags = ['User']
        #swagger.description = '修改密碼功能' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: '修改密碼功能',
          required: true,
          schema: {
              "password": "newpassword",
              "confirmPassword": "newpassword"
        }
    } */ 
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string"
        },
        description: "密碼修改成功"
    } */
    /* #swagger.responses[400] = { 
        schema: {
            "error": "string"
        },
        description: "Bad request. 密碼不一致或格式不正確。"
    } */
    /* #swagger.responses[404] = { 
        schema: {
            "error": "string"
        },
        description: "Not found. 用戶未找到。"
    } */
    /* #swagger.responses[500] = { 
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async (req, res, next) => {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return next(appError(400, '密碼不一致！'));
    }

    // 密碼是否低於8碼
    if (!validator.isLength(password, { min: 8 })) {
      return next(appError(400, "密碼字數低於8碼"));
    }
    
    // 密碼至少包含一個字母和一個數字
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return next(appError(400, "密碼需包含至少一個字母和一個數字"));
    }

    const newPassword = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.user.id, {
      password: newPassword
    }, { new: true }); // 確保返回更新後的用戶

    if (!user) {
      return next(appError(404, '用戶未找到'));
    }

    generateSendJWT(user, 200, res);
}));

/* get personal like list */
router.get('/getLikeList',
    /*  #swagger.tags = ['User']
        #swagger.description = '獲取個人喜歡列表' */
      /* #swagger.security = [{
              "apiKeyAuth": []
      }] */
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": [
                {
                    "_id": "string",
                    "title": "string",
                    "content": "string",
                    "createdAt": "string",
                    "user": {
                        "_id": "string",
                        "name": "string"
                    }
                }
            ]
        },
        description: "獲取個人喜歡列表成功"
    } */
    /* #swagger.responses[401] = { 
        schema: {
            "error": "string"
        },
        description: "Unauthorized. Invalid or missing token."
    } */
    /* #swagger.responses[500] = { 
        schema: {
            "error": "string"
        },
        description: "Internal server error."
    } */ 
    isAuth, handleErrorAsync(async (req, res, next) => {
      const likeList = await Post.find({
        "likes.user": req.user.id // 確保只返回當前用戶按讚的貼文
      })
      .select("content image createdAt") // 選取所需字段
      .populate({
        path: "user", // 填充貼文作者信息
        select: "name _id photo"
      });
  
      appSuccess(res, 200, 'success', likeList);
    })
  );

/* follow friend */
router.post('/:id/follow',
  /*  #swagger.tags = ['User']
      #swagger.description = '追蹤好友' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
  /* #swagger.parameters['id'] = {
        in: 'path',
        description: '被追蹤用戶的ID',
        required: true,
        type: 'string'
  } */ 
  /* #swagger.responses[200] = { 
      schema: {
          "message": "string"
      },
      description: "你已成功追蹤！"
  } */
  /* #swagger.responses[400] = { 
      schema: {
          "error": "string"
      },
      description: "Bad request. 無法追蹤自己或其他錯誤。"
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
   
  if(req.params.id === req.user.id) {
    return next(appError(401, '您無法追蹤自己' ,next));
  }

  // 更新當前用戶的following列表
  await User.updateOne(
    {
      _id: req.user.id,
      'following.user': { $ne: req.params.id }
    },
    {
      $addToSet: { following: { user: req.params.id }}
    }
  );
  // 更新目標用戶的followers列表
  await User.updateOne(
    {
      _id: req.params.id,
      'followers.user': { $ne: req.user.id}
    },
    {
      $addToSet: { followers: { user: req.user.id}}
    }
  );
  appSuccess(res, 200, '你已成功追蹤！')
}));

/* unfollow friend */
router.delete('/:id/unfollow',
  /*  #swagger.tags = ['User']
      #swagger.description = '取消追蹤好友' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
  /* #swagger.parameters['id'] = {
        in: 'path',
        description: '被取消追蹤用戶的ID',
        required: true,
        type: 'string'
  } */ 
  /* #swagger.responses[200] = { 
      schema: {
          "message": "string"
      },
      description: "你已成功取消追蹤！"
  } */
  /* #swagger.responses[400] = { 
      schema: {
          "error": "string"
      },
      description: "Bad request. 無法取消追蹤自己或其他錯誤。"
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

  if(req.params.id === req.user.id) {
    return next(appError(401, '您無法取消追蹤自己', next))
  }
  await User.updateOne(
    {
      _id: req.user.id
    },
    {
      $pull: { following: { user: req.params.id }}
    }
  );
  await User.updateOne(
    {
      _id: req.params.id
    },
    {
      $pull: { followers: { user: req.user.id }}
    }
  );
  appSuccess(res, 200, '你已成功取消追蹤！')
}));

/* get personal following list */
router.get('/following',
  /*  #swagger.tags = ['User']
      #swagger.description = '獲取個人追蹤列表' */
     /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
  /* #swagger.responses[200] = { 
      schema: {
          "message": "string",
          "data": [
              {
                  "_id": "string",
                  "name": "string"
              }
          ]
      },
      description: "獲取個人追蹤列表成功"
  } */
  /* #swagger.responses[401] = { 
      schema: {
          "error": "string"
      },
      description: "Unauthorized. Invalid or missing token."
  } */
  /* #swagger.responses[404] = { 
      schema: {
          "error": "string"
      },
      description: "Not found. 找不到用戶。"
  } */
  /* #swagger.responses[500] = { 
      schema: {
          "error": "string"
      },
      description: "Internal server error."
  } */ 
  isAuth, handleErrorAsync(async(req, res, next) =>{
  const user = await User.findById(req.user.id).populate({
    path: 'following.user',
    select: 'name _id photo'
  })
  if (!user) {
      return next(appError(404, '找不到用戶', next));
  }

  appSuccess(res, 200, 'success', user.following);
}));

/* get personal unfollowed list */
router.get('/unfollowed', isAuth, handleErrorAsync(async (req, res, next) => {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return next(appError(404, '當前用戶未找到'));
      }
  
      // Find users that are not in the current user's following list
      const unfollowedUsers = await User.find({
        _id: { $ne: req.user.id }, // Exclude the current user
        'followers.user': { $ne: req.user.id } // Exclude users that the current user is already following
      }).select('name photo followers');
  
      appSuccess(res, 200, '獲取未追蹤用戶列表成功', unfollowedUsers);
    })
  );

module.exports = router;
