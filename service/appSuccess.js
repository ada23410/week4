const appSuccess = (res, httpStatus, message, data = {}) => {
    res.status(httpStatus).json({
        status: 'success',
        message,
        data
    });
};

module.exports = appSuccess;
