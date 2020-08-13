var mongoose = require('mongoose');
var ph = require('path');
var cytus = require('../../utilities/CytusCTL/CytusPrototcol')
// subDOC

// schema define
var workspaceSet_Schema = new mongoose.Schema({
    name: String,
    LastPodName:String,
    config: {
        tensorflowVersion: String,
        GpuNum:Number,
    },
    notification: [{
        type: String,
        title: String,
        detail:String
    }],
    scheduleList:[String],
    commandList: [],
    workRecord : [
        {
            logPath:String,
            podName:String,
            status:String,
            CreateDate:Date,
        }
    ]
});

// schema define
var workMonitor_Schema = new mongoose.Schema({
    LoginInfo: {
        lastIp:String,
        lastDate:Date,
    },
    SocketConnection: {
        // detect is socket alive
        is_connect: Boolean,
        public_Key: String,
        socketuuid: String
    },
    notyfication: [
        {
            type:String,
            Title:String,
            Message:String,
        }
    ]
});

// schema define
var UserData_Schema = new mongoose.Schema({
    account: String,
    password: String,
    rootPath: String,
    workspaceSet: [workspaceSet_Schema],
    WorkMonitor: workMonitor_Schema
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
UserData_Schema.methods.CreateWorkspaceRecord = function({WsName}) {
    let newConfigRecord = {
        name: WsName,
        LastPodName: null,
        config: {},
        scheduleList:[],
        workRecord:[]
    }

    for(element of this.workspaceSet){
        if(element.name === WsName) {
            throw WsName + ' is already exist in set! there might be serverSide error!'
        }
    };

    this.workspaceSet.push(newConfigRecord);
};

UserData_Schema.methods.DeleteWorkspaceRecord = function({WsName}) {
    
    for(element of this.workspaceSet){
        if(element.name === WsName) {
            element.remove();
        }
    };

    return this.workspaceSet;

};


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
        scheduleList:[],
        workRecord:[]
    }
    this.workspaceSet.push(newConfigRecord)
    console.log('end setting config with create new workspaceset')
};

UserData_Schema.methods.getcommandList = function({WsName}) {
    for(element of this.workspaceSet){
        if(element.name === WsName) {
            console.log('in getcommandList of : ' + WsName);
            console.log(element.commandList)
            return element.commandList;
        }
    };

    return [];
    
};

UserData_Schema.methods.setcommandList = function({WsName, payload}) {
    console.log('in setcommandList payload is: ');
    console.log(payload)
    let {commandList} = payload;
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            element.commandList = commandList;
            console.log('end setting setcommandList with update exist workspaceset')
            return ;
        }
    }
    // if has no exist
    let newConfigRecord = {
        name: WsName,
        config: {},
        commandList:commandList
    }
    this.workspaceSet.push(newConfigRecord)
    console.log('end setting commandList with create new workspaceset')
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

// workspace operator methods
UserData_Schema.methods.CreateWorkRecord = function({WsName}) {
    let curWorkspace;
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            // 取得選定的workspace
            curWorkspace = element;
        }
    }
    // 開始創建新的record
    // 記錄時間戳記
    let timestamp = new Date();
    let podName = `${this.account}.${WsName}-${timestamp.getTime()}`;
    let newRecord = {
        logPath: ph.join(process.env.ROOTPATH, this.account, 'Workspace', WsName, '.secrete/logs', podName+'.txt'),
        podName: podName.toLocaleLowerCase(),
        status: cytus.CytusAppStatus.WAIT,
        CreateDate: timestamp
    }
    // 加入記錄到指定worksepce的workRecord中
    curWorkspace.workRecord.push(newRecord);
    // 更新 LastPodName
    curWorkspace.LastPodName=newRecord.podName;
    // 回傳newRecord物件
    return newRecord;
};

UserData_Schema.methods.Get_LastPod_Record = function({WsName}) {
    let curWorkspace;
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            // 取得選定的workspace
            curWorkspace = element;
        }
    }

    console.log('query workspaceSet to get target workspace');
    console.log(curWorkspace);

    for(element of curWorkspace.workRecord) {
        if(element.podName === curWorkspace.LastPodName) {
            // 取得選定的workspace
            return element;
        }
    }

    // if no LastPod
    return undefined;
}

UserData_Schema.methods.Set_LastPod_Running = function({WsName}) {
    let curWorkspace;
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            // 取得選定的workspace
            curWorkspace = element;
        }
    }

    console.log('query workspaceSet to set target workspace workRecord finish');
    console.log(curWorkspace);

    for(element of curWorkspace.workRecord) {
        if(element.podName === curWorkspace.LastPodName) {
            // 取得選定的workspace
            element.status = cytus.CytusAppStatus.RUNNING;
            return element;
        }
    }

    // if no LastPod
    return undefined;
}

UserData_Schema.methods.Set_LastPod_Finished = function({WsName}) {
    let curWorkspace;
    for(element of this.workspaceSet) {
        if(element.name === WsName) {
            // 取得選定的workspace
            curWorkspace = element;
        }
    }

    console.log('query workspaceSet to set target workspace workRecord finish');
    console.log(curWorkspace);

    for(element of curWorkspace.workRecord) {
        if(element.podName === curWorkspace.LastPodName) {
            // 取得選定的workspace
            element.status = cytus.CytusAppStatus.COMPLETE;
            return element;
        }
    }

    // if no LastPod
    return undefined;
}

// compile schema to modle
var UserData = mongoose.model("UserData", UserData_Schema);


// exports
module.exports = UserData;
