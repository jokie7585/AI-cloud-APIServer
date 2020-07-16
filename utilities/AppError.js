const httpStatus = require('http-status');

const errorType = {
    WORKSPACE_CREATE_ERROR:'WORKSPACE_CREATE_ERROR'
}

const errorCode = {
    WORKSPACE_CREATE_ERROR:500
}

const errorMsg = {
    WORKSPACE_CREATE_ERROR: 'Error occurs when user is failed to create workspace!'
}

class AppError extends Error {

    constructor(errorType, operationLog, isPublic, nodeErr) {
        super(errorMsg[errorType]);
        this.operationLog = operationLog;
        this.name = errorType;
        this.nodeErr = nodeErr;
        this.isPublic = isPublic;
        this.code = `[${errorCode[errorType]}] ${httpStatus[errorCode[errorType]]}`;
        // 建立 error.stack property (super建構式只會建立massage這個property, 其他都要自己加)
        Error.captureStackTrace(this, this.constructor.name);
    }

    toString() {
        let stcketrace = this.stack.split('\n').slice(1);
        let format = '\n---------------------\n';
        format = format.concat(`[ErrorName]  : ${this.name}\n`);
        format = format.concat(`[Massage]    : ${this.message}\n`);
        format = format.concat(`[Code]       : ${this.code}\n`);
        format = format.concat(`[nodeErr]    : ${this.nodeErr}\n`);
        format = format.concat(`[IsPublic]   : ${this.isPublic}\n`);
        format = format.concat(`[Op_Log]     : \n${this.operationLog}\n`);
        format = format.concat(`[StckeTrace] : \n${stcketrace.join('\n')}`);
        format = format.concat(`\n---------------------\n`);
        return format;
    }
    
}


module.exports = {
    AppError,
    errorType
}

