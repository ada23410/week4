// Production 環境錯誤
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

const errorHandler = (err, req, res, next) => {
err.statusCode = err.statusCode || 500;
if (process.env.NODE_ENV === 'development') {
    return resErrorDev(err, res);
} else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'ValidationError') {
    // mongoose 資料辨識錯誤
    err.message = '資料欄位未填寫正確';
    err.isOperational = true;
    return resErrorProd(err, res);
    }
    resErrorProd(err, res);
}
};

module.exports = errorHandler;
  