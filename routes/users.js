const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const appError = require('../service/appError');
const appSuccess = require('../service/appSuccess');
const handleErrorAsync = require('../service/handleErrorAsync');
const {isAuth,generateSendJWT} = require('../service/auth');
const app = require('../app');
const router = express.Router();

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

/* profile */
router.get('/profile', isAuth, handleErrorAsync(async (req, res, next) => {
  appSuccess(res, 200, '檢視個人資料成功！', {
    name: req.user.name,
    email: req.user.email,
    sex: req.user.sex
  });
}));

/* update profile */
router.patch('/profile', isAuth, handleErrorAsync(async (req, res, next) => {

  const { name, sex } = req.body;

  // 更新用戶資料
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, sex },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(appError(404, '用戶不存在'));
  }

  appSuccess(res, 200, '更新個人資料成功！', {
    name: updatedUser.name,
    email: updatedUser.email,
    sex: updatedUser.sex
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
