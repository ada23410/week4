const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const appError = require('../service/appError');
const appSuccess = require('../service/appSuccess');
const handleErrorAsync = require('../service/handleErrorAsync');
const app = require('../app');
const router = express.Router();

/* 產生JWT*/
const generateSendJWT = (user, statusCode, res) => {
  // 產生JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_DAY
    });
    user.password = undefined;

    res.status(statusCode).json({
      status: 'success',
      user: {
        token,
        name: user.name,
        email: user.email
      }
    });
};

/* sign-up */
router.post('/sign_up', handleErrorAsync(async (req, res, next) => {

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

    // 是否為email格式
    if (!validator.isEmail(email)) {
        return next(appError(400, "Email格式不正確"));
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
router.post('/sign_in', handleErrorAsync(async (req, res, next) => {
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

const isAuth = handleErrorAsync(async (req, res, next) => {
  // 確認token 是否存在
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(appError(401, '你尚未登入！'));
  }

  // 驗證token正確性
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(appError(401, '用戶不存在'));
  }
  req.user = currentUser;
  next();
});

/* profile */
router.get('/profile', isAuth, handleErrorAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
}));

/* update password */
router.post('/updatePassword', isAuth, handleErrorAsync(async (req, res, next) => {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return next(appError(400, '密碼不一致！'));
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


module.exports = router;
