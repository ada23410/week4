/**
 * transformId.js
 * 
 * 用於轉換Schema 的_id，改輸出為 id
 * 
 */

const transformId = (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
};

module.exports = transformId