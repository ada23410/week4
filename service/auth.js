const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const appError = require('../service/appError');
const handleErrorAsync = require('../service/handleErrorAsync');

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

module.exports = {
  isAuth,
  generateSendJWT
}