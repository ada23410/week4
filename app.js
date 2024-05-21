const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// 資料庫設定開始
const mongoose = require('mongoose');
const dotenv= require('dotenv');

// 路由
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const app = express();

// 程式出現重大錯誤時
process.on('uncaughtException', err => {
    // 記錄錯誤下來，等到服務都處理完後，停掉該 process
    console.error('Uncaughted Exception！')
    console.error(err);
    process.exit(1);
});

// 環境變數
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
    '<password>',
    process.env.DATABASE_PASSWORD
);
  
mongoose.connect(DB)
    .then(res=> console.log("連線資料成功"))
    .catch((error)=> {console.log('資料連線失敗',error)});


// 使用cors
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);

app.use(function(req, res, next) {
    res.status(404).json({
      status: 'error',
      message: "無此路由資訊",
    });
});

// production 環境錯誤
const resErrorProd = (err, res) => {
if (err.isOperational) {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
} else {
    // log 紀錄
    console.error('出現重大錯誤', err);
    // 送出罐頭預設訊息
    res.status(500).json({
    status: 'error',
    message: '系統錯誤，請恰系統管理員'
    });
}
};

// 開發環境錯誤（development）
const resErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        message: err.message,
        error: err,
        stack: err.stack
    });
};

// error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    if (process.env.NODE_ENV === 'dev') {
        return resErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        if (err.name === 'ValidationError'){
            // mongoose 資料辨識錯誤
            err.message = "資料欄位未填寫正確";
            err.isOperational = true;
            return resErrorProd(err, res)
        }
        resErrorProd(err, res)
    }
});

// const port = process.env.PORT || 3000; 
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

// 未捕捉到的 catch 
process.on('unhandledRejection', (err, promise) => {
    console.error('未捕捉到的 rejection：', promise, '原因：', err);
  });

module.exports = app;
