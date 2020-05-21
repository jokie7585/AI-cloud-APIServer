const httpStatus = require('http-status');

class AppError extends Error {
    constructor(message, status, isPublic, code) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        this.status = status;
        this.isPublic = isPublic;
        this.code = code;
        // 建立 error.stack property (super建構式只會建立massage這個property, 其他都要自己加)
        Error.captureStackTrace(this, this.constructor.name);
    }
    
}



export {
    httpStatus,
    AppError
}