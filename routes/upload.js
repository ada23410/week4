const express = require('express');
const router = express.Router();
const appError = require('../service/appError');
const appSuccess = require('../service/appSuccess');
const handleErrorAsync = require('../service/handleErrorAsync');
const upload = require('../service/images');

const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('../service/firebase');
const bucket = firebaseAdmin.storage().bucket();

const {isAuth,generateSendJWT} = require('../service/auth');

router.post('/file',
    /*  #swagger.tags = ['File']
        #swagger.description = '檔案上傳功能' */
    /* #swagger.security = [{
            "apiKeyAuth": []
    }] */
    /* #swagger.parameters['file'] = {
        in: 'formData',
        description: '要上傳的檔案',
        required: true,
        type: 'file'
    } */
    /* #swagger.responses[200] = { 
        schema: {
            "message": "string",
            "data": {
                "fileUrl": "string"
            }
        },
        description: "上傳成功"
    } */
    /* #swagger.responses[400] = {
        schema: {
            "error": "string"
        },
        description: "Bad request. 檔案大小超過 2MB 或其他錯誤。"
    } */
    /* #swagger.responses[500] = {
        schema: {
            "error": "string"
        },
        description: "Internal server error. 上傳失敗。"
    } */
    isAuth ,upload , (req, res, next) => {
        console.log('Before multer - Request body:', req.body);
        console.log('Before multer - Request files:', req.files);
        next();
    }, handleErrorAsync(async (req, res, next)=> {
            console.log('After multer - Request body:', req.body);
            console.log('After multer - Request files:', req.files);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(appError(400, '檔案大小超過 2MB', next));
                }
                return next(appError(400, '檔案上傳失敗', next));
            } else if (err) {
                return next(appError(400, err.message, next));
            }

            // 是否有上傳檔案
            if (!req.files.length) {
                return next(appError(400, "尚未上傳檔案", next));
            }

            // 取得上傳的檔案資訊列表裡面的第一個檔案
            const file = req.files[0];
            // 基於檔案的原始名稱建立一個 blob 物件
            const blob = bucket.file(`images/${uuidv4()}.${file.originalname.split('.').pop()}`);
            // 建立一個可以寫入 blob 的物件
            const blobStream = blob.createWriteStream();

            // 監聽上傳狀態，當上傳完成時，會觸發 finish 事件
            blobStream.on('finish', () => {
                // 設定檔案的存取權限
                const config = {
                    action: 'read', // 權限
                    expires: '12-31-2500', // 網址的有效期限
                };
                // 取得檔案的網址
                blob.getSignedUrl(config, (err, fileUrl) => {
                    if (err) {
                        return next(appError(500, '取得檔案網址失敗', next));
                    }
                    appSuccess(res, 200, '上傳成功', { fileUrl });
                });
            });

            // 如果上傳過程中發生錯誤，會觸發 error 事件
            blobStream.on('error', (err) => {
                return next(appError(500, '上傳失敗', next));
            });

        // 將檔案的 buffer 寫入 blobStream
        blobStream.end(file.buffer);
}));

module.exports = router;