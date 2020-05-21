var mongoose = require('mongoose');
// subDOC

// schema define
var workspaceSet_Schema = new mongoose.Schema({
    name: String,
    config: {
        tensorflowVersion: String,
        GpuNum:Number,
    },
    scheduleList:[String]
});

// schema define
var UserData_Schema = new mongoose.Schema({
    account: String,
    password: String,
    rootPath: String,
    workspaceSet: [workspaceSet_Schema]
});

// add functionality to schema(mongoDocument)
UserData_Schema.methods.isUser = function({account, password}) {
    if(account === this.account && password === this.password) return true;
    return false;
};

// add functionality to schema(mongoDocument)
/**
 * Workspace operation
 */
UserData_Schema.methods.getConfig = function({WsName}) {
    for(element of this.workspaceSet){
        if(element.name === WsName) {
            console.log('in getConfig of : ' + WsName);
            console.log(element.config)
            return element.config;
        }
    };
    return {
        tensorflowVersion:'',
        GpuNum:''
    };
};

UserData_Schema.methods.setConfig = function({WsName, payload}) {
    console.log('in setConfig payload is: ');
    console.log(payload)
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            element.config = payload;
            console.log('end setting with update exist workspaceset')
            return;
        }
    }
    // if has no exist
    let newConfigRecord = {
        name: WsName,
        config: payload,
        scheduleList:[]
    }
    this.workspaceSet.push(newConfigRecord)
    console.log('end setting config with create new workspaceset')
};

UserData_Schema.methods.getscheduleList = function({WsName}) {
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            return element.scheduleList;
        }
    };
    return [];
};

UserData_Schema.methods.setscheduleList = function({WsName, payload}) {
    console.log('in setscheduleList payload is: ');
    console.log(payload)
    let {scheduleList} = payload;
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            element.scheduleList = scheduleList;
            console.log('end setting setscheduleList with update exist workspaceset')
            return ;
        }
    }
    // if has no exist
    let newConfigRecord = {
        name: WsName,
        config: {},
        scheduleList:scheduleList
    }
    this.workspaceSet.push(newConfigRecord)
    console.log('end setting with create new workspaceset')
};

// compile schema to modle
var UserData = mongoose.model("UserData", UserData_Schema);


// exports
module.exports = UserData;
