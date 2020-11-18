// nodejs require
var fs = require('fs');
var ph = require('path');
var jsYaml = require('js-yaml')
var cytus = require('./CytusCTL/CytusPrototcol')
const fsPromise = fs.promises;
var {spawnSync, execFileSync} = require('child_process');
const { identity } = require('lodash');
const { CytusAppStatus } = require('./CytusCTL/CytusPrototcol');
const { option } = require('yargs');


function LoadWSList (userId, cb) {
    let Path = ph.join(process.env.ROOTPATH, userId, 'Workspace')
    fs.readdir(Path, {withFileTypes: true}, (err, files) =>{
        if(!err) {
            let payLoad = files.map(el => {
                if(el.isDirectory()) {
                    return({
                        name: el.name,
                        type: 'dir'
                    })
                }
                else if(el.isFile()) {
                    return({
                        name: el.name,
                        type: 'file'
                    })
                }
                else{
                    throw new Error('exception in Utility.workingFunction.LS');
                }
            })
            
            cb(payLoad);
        }
        else{
            console.error(err);
        }
        
    })
}

// 查詢根目錄內某user的目錄
function LS(userID, path='/' ,cb) {
    let Path = '';
    if(process.env.ROOTPATH) {
        Path = ph.join(Path, process.env.ROOTPATH) 
    }
    // 若用戶端想訪問指定用戶的root會使用root當path,但實際上並沒有這個path
    path = ph.normalize(path)
    Path = ph.join(Path, userID, path)
    console.log('In LS() path is: ' + Path);
    
    fs.readdir(Path, {withFileTypes: true}, (err, files) =>{
        if(!err) {
            let payLoad = files.map(el => {
                if(el.isDirectory()) {
                    return({
                        name: el.name,
                        type: 'dir'
                    })
                }
                else if(el.isFile()) {
                    return({
                        name: el.name,
                        type: 'file'
                    })
                }
                else{
                    throw new Error('exception in Utility.workingFunction.LS');
                }
            })
            
            cb(payLoad);
        }
        else{
            console.error(err);
        }
        
    })
};

async function CreateUserRootFolder(UserId) {
    let path = process.env.ROOTPATH || process.cwd()
    path = ph.join(path, UserId)
    let Monitor = ph.join(path,'Monitor')

    await fsPromise.mkdir(path)
    .then(()=> {
        console.log(path + 'is created')
    })
    .catch(err => {
        if(err) throw err;
    })

    await fsPromise.mkdir(ph.join(path, 'Workspace'))
    .then(()=> {
        console.log(`${UserId}'s workspace root created!`)
    })
    .catch(err => {
        if(err) throw err;
    })

    await fsPromise.mkdir(Monitor)
    .then(()=> {
        console.log(`${UserId}'s Monitor Folder created!`)
    })
    .catch(err => {
        if(err) throw err;
    })

    await fsPromise.mkdir(ph.join(Monitor,'logs'))
    .then(()=> {
        console.log(`${UserId}'s Monitor/logs Folder created!`)
    })
    .catch(err => {
        if(err) throw err;
    })
} 



async function RunWorkspace(payload) {
    let {userId, WsName} = payload;
    let secretePath = ph.join(process.env.ROOTPATH,userId,WsName,'.secrete');
    let yamlPath = ph.join(secretePath, 'podConfig.yaml')
    let scriptPath = ph.join(secretePath, 'script_preparePod.sh')
    await fsPromise.access(yamlPath)
    .catch(err => {
        throw 'server side error ouccur, plz contactus'
    })
    console.log('sync run:' + scriptPath);
    let buf = spawnSync('sh', [scriptPath]);
    // console.log(buf.stdout.toString())
    console.log(buf.stderr.toString())
    return 'success run script!'
}

// yaml creater fuction set

async function GenerateYaml(payLoad) {
    let {userId, config,commandList, scheduleList, WsName,credential,logPath,podName} = payLoad;
    let workspaceRoot = ph.join(process.env.ROOTPATH,userId, 'Workspace',WsName).toString();
    let AppRoot = ph.join(process.env.ROOTPATH,userId, 'Workspace',WsName, 'AppRoot').toString();
    let AppLogRoot = ph.join(workspaceRoot, '.secrete/logs')
    console.log('volumes path :')
    console.log(workspaceRoot)
    // normlized path in container
    var getLogPathInContainer = new RegExp(/\/\.secrete(.*)/);
    let logPathInContainer = logPath.match(getLogPathInContainer)[1];
    // prepare config
    let Podname = podName; // assign podName
    let {tensorflowVersion, GpuNum} = config;
    // yaml Template
    let yaml = {
        apiVersion: "v1",
        kind: "Pod",
        metadata: {
            name: Podname.toLocaleLowerCase(), // pod name should be lower case
            labels: {
                app: "tensorflow-runtime"
            }
        },
        spec: {
            restartPolicy: "Never",
            containers: [
                {
                    name: "tensorflow-runtime",
                    image: "tensorflow/tensorflow:" + tensorflowVersion, // tensorflowVersion
                    env: [
                        {
                            name: "APISERVER_IP",
                            value: process.env.APISERVER_IP
                        },
                        {
                            name: "USERID",
                            value: userId
                        },
                        {
                            name: "WsName",
                            value: WsName
                        },
                        {
                            name: "branch",
                            value: 'Template'
                        },
                        {
                            // this is the public key for k8s cluster to access apiserver
                            name: "Session_Token",
                            value: credential
                        },
                        {
                            name: "LogPath",
                            value: logPathInContainer
                        }
                    ],
                    imagePullPolicy: "IfNotPresent",
                    command: ["/bin/sh"],
                    args: createBashArgs(commandList), // generat bash args
                    volumeMounts: [
                        {
                            mountPath: '/mnt/',
                            name: "work-space"
                        },
                        {
                            mountPath: "/logs/",
                            name: "log-root"
                        }
                    ],
                    resources: {
                        limits: {
                            'nvidia.com/gpu': GpuNum
                        }
                    }
                }
            ],
            volumes: [
                {
                    name: "work-space",
                    hostPath: {
                        path: AppRoot, // workspaceRoot here
                        type: "Directory"
                    }
                },
                {
                    name: "log-root",
                    hostPath: {
                        path: AppLogRoot, // workspaceRoot here
                        type: "Directory"
                    }
                },
            ]
        }
    }

    // 寫入指定資料夾
    let target = ph.join(workspaceRoot, '.secrete', 'podConfig.yaml');
    let yamlStream = jsYaml.dump(yaml, jsYaml.JSON_SCHEMA)
    let fileHandler = await fsPromise.open(target, 'w+');
    console.log('start write')
    await fileHandler.writeFile(yamlStream)
    console.log('end write')
    await fileHandler.close();
    return 'success create - podConfig.yaml';
}

function createBashArgs(ScheduleList, BatchCommandList) {
    let args = ["-c"];
    let shellScript = '';
    // 編輯指令
    // 切換至容器工作區
    shellScript = shellScript.concat('cd /mnt;');
    // 殺出request告知server此pod成功啟動並更新資料庫
    shellScript = shellScript.concat(`curl $APISERVER_IP/users/$USERID/management/api/workRecord/setRunning/$WsName/$branch ;`);
    // 初始化logFile
    shellScript = shellScript.concat('echo "your application log start below..." > $LogPath;');
    for (command of ScheduleList) {
        if(command[0] != '#') {
            shellScript = shellScript.concat(command + ' >> $LogPath 2>&1;');
        }
        
    }
    // 發出 curl 請求,通知server完成工作
    shellScript = shellScript.concat(`curl $APISERVER_IP/users/$USERID/management/api/workRecord/setFinish/$WsName/$branch ;`);
    // 提示使用者是否執行完畢
    shellScript = shellScript.concat('echo "\nConsole diconnected!..." >> $LogPath;');
    // 結束shell
    // shellScript = shellScript.concat('done');
    args.push(shellScript);
    console.log('finish args set: ')
    console.log(args);
    return args;
}

function appendBatchCommand(BatchCommandList) {

}

async function CreateWorkspace(payload) {
    let {WSName, UserId} = payload;
    if(WSName === '') throw 'Workspace name cannot be empty!'
    let path = ph.join(process.env.ROOTPATH, UserId, 'Workspace', WSName);
    await fsPromise.mkdir(path).catch(err=> {
        console.log(err)
        throw 'workspace is already Exist! plz use another name!'
    })
    // 產生 AppRoot
    await fsPromise.mkdir(ph.join(path, 'AppRoot'))
    // 產生secret dir
    path = ph.join(path, '.secrete')
    await fsPromise.mkdir(path)
    await fsPromise.mkdir(ph.join(path, 'logs'))
    await fsPromise.mkdir(ph.join(path, 'monitor'))
    // await fsPromise.mkdir(ph.join(path, 'cach'))
    
    return WSName
}

async function DeleteWorkspace(payload) {
    let {WSName, UserId} = payload;
    let path = ph.join(process.env.ROOTPATH, UserId, 'Workspace', WSName);
    deleteFolderRecursive(path);
    console.log('success recursive delete path: ' + path);
    return WSName;
}

var deleteFolderRecursive = (path) => {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file) {
          var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
  };

  async function UploadJobToCytus(podname,gpunumber, userId, WsName) {
    let yamlpath = ph.join(process.env.ROOTPATH, userId, 'Workspace', WsName, '.secrete/podConfig.yaml')
    // let scriptPath = ph.join(process.cwd(), 'utilities/CytusCTL/jobUploader.js')
    // let stdout = execFileSync(scriptPath ,['-n', podname, '-p', yamlpath, '-g', gpunumber], {encoding:'utf-8'})
    // return stdout
    return spawnSync('kubectl', ['create', '-f', yamlpath]);
  }

  async function UploadJobToCytus_2(branchset) {
    for(let branch of branchset) {
        let {yamalPath} = branch;
        let stdout = spawnSync('kubectl', ['create', '-f', yamalPath]);
        console.log(yamalPath)
        console.log(stdout.stdout.toString())
        console.log(stdout.output.toString())
        console.log(stdout.stderr.toString())
    }
    return 'success submit batch to Cetus';
  }

  ///Users/tsaipengying/Desktop/工具學習/nodejs_Backend_Learning/hello_express/Storage/fs/Workspace/catdog/.secrete/branch0.yaml
  ///Users/tsaipengying/Desktop/工具學習/nodejs_Backend_Learning/hello_express/Storage/fs/Workspace/catdog/.secrete/branch0.yaml
  async function getFileContentAsString(logPath, cb){
    let fr = await fsPromise.open(logPath, 'r');
    let content = await fr.readFile({encoding: 'utf-8'});
    fr.close();
    cb(content);
  }

  async function cachWorkspace(userId, Wsname){
    let cachPath = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, '.secrete/cach');
    let source = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, 'AppRoot');
    // clean old cach
    deleteFolderRecursive(cachPath);
    let out  = fs.mkdirSync(cachPath)
    console.log(out)
    // cach new data
    let stdout = spawnSync('cp', ['-a', source+'/.', cachPath]);
    console.log(stdout)
  }

  async function loadWorkspaceCach(userId, Wsname, cb){
    let commandString = 'cp';
    let cachPath = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, '.secrete/cach');
    let source = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, 'AppRoot');
    if(!fs.existsSync(cachPath)) {
        throw new Error('no cach exist! you might Never run workspace, or cach is just deleted!')
    }
    else{
        // clean old AppRoot
        deleteFolderRecursive(source);
        let out  = fs.mkdirSync(source)
        // cach new data
        let stdout = spawnSync('cp', ['-a', cachPath+'/.', source]);
        fs.readdir(source, {withFileTypes: true}, (err, files) =>{
            if(!err) {
                let payLoad = files.map(el => {
                    if(el.isDirectory()) {
                        return({
                            name: el.name,
                            type: 'dir'
                        })
                    }
                    else if(el.isFile()) {
                        return({
                            name: el.name,
                            type: 'file'
                        })
                    }
                    else{
                        throw new Error('exception in Utility.workingFunction.LS');
                    }
                })
                
                cb(payLoad);
            }
            else{
                console.error(err);
            }
            
        })
    }
  }  

  function LStargetDir(path) {
    let files = fs.readdirSync(path, {withFileTypes: true});
    let payLoad = files.map(el => {
        if(el.isDirectory()) {
            return({
                name: el.name,
                type: 'dir'
            })
        }
        else if(el.isFile()) {
            return({
                name: el.name,
                type: 'file'
            })
        }
        else{
            throw new Error('exception in Utility.workingFunction.LS');
        }
    })
    return payLoad;
  }

  async function resetWorkspaceRoot(userId,Wsname){
    let source = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, 'AppRoot');
    // clean old AppRoot
    deleteFolderRecursive(source);
    await fsPromise.mkdir(source);

   }

   async function deleteFile(userId,Wsname,relativepath, fileNmae){
    let taeget = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, 'AppRoot', relativepath, fileNmae);
    let targetDir = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, 'AppRoot', relativepath);
    let status = fs.statSync(taeget);
    if( status.isFile()) {
        fs.unlinkSync(taeget);
    }
    else {
        console.log('Delete path : ' + taeget)
        deleteFolderRecursive(taeget);
    }
    let payload = LStargetDir(targetDir)
    return payload;
}


   function ComposeCetusPath(userId, Wsname){
    let cachPath = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, '.secrete/cach');
    let source = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, 'AppRoot');
    return{cach: cachPath, AppRoot:source }
   }

   async function RunBatchWork(payload){
    let {batchset, userId, WsName, config, scheduleList, commandList, credential} = payload;
    let newbatchset = []
    // 準備資料夾
    let SourceRoot = ph.join(process.env.ROOTPATH, userId, 'Workspace', WsName, 'AppRoot');
    let rootOfBranch = ph.join(process.env.ROOTPATH, userId, 'Workspace', WsName);
    let rootOfLogs = ph.join(process.env.ROOTPATH, userId, 'Workspace', WsName, '.secrete/logs');

    for(let branch of batchset) {
        // 每個branch都必須要有自己的workspace
        let {name, CommandList} = branch;
        let timestamp = new Date();
        let podName = `${userId}.${WsName}-${name}-${timestamp.getTime()}`.toLocaleLowerCase();
        let root = ph.join(rootOfBranch, name);
        let logPath =  ph.join(rootOfLogs, podName+'.txt')
        let yamalPath =  ph.join(process.env.ROOTPATH, userId, 'Workspace', WsName, '.secrete', name+'.yaml');
        // prepare structure to generate yaml & update database
        let registPayload = {
            podName: podName,
            branchName: name,
            root: root,
            config: config,
            scheduleList: scheduleList,
            commandList: CommandList,
            credential: credential,
            logPath: logPath,
            userId: userId,
            WsName: WsName,
            yamalPath:yamalPath
        }
        // set branch info
        branch.logPath = logPath
        branch.podname = podName
        branch.root = root
        branch.yamalPath = yamalPath
        branch.status = CytusAppStatus.WAIT
        // push into "newbatchset" structure
        newbatchset.push(registPayload)

        // clean old branch root
        deleteFolderRecursive(root);
        let out  = fs.mkdirSync(root)
        // load data from AppRoot
        let stdout = spawnSync('cp', ['-a', SourceRoot+'/.', root]);
        // end of data preparing

        // Generate yaml
        await GenerateYaml_BatchUse(registPayload);

    }

    return newbatchset
    
}

async function GenerateYaml_BatchUse(payLoad) {
    let {userId, branchName, config,commandList, scheduleList, WsName,credential,logPath,podName, root,yamalPath} = payLoad;
    let workspaceRoot = ph.join(process.env.ROOTPATH,userId, 'Workspace',WsName).toString();
    let AppLogRoot = ph.join(workspaceRoot, '.secrete/logs')
    console.log('volumes path :')
    console.log(workspaceRoot)
    // normlized path in container
    var getLogPathInContainer = new RegExp(/\/\.secrete(.*)/);
    let logPathInContainer = logPath.match(getLogPathInContainer)[1];
    // prepare config
    let Podname = podName; // assign podName
    let {tensorflowVersion, GpuNum} = config;
    // yaml Template
    let yaml = {
        apiVersion: "v1",
        kind: "Pod",
        metadata: {
            name: Podname.toLocaleLowerCase(), // pod name should be lower case
            labels: {
                app: "tensorflow-runtime"
            }
        },
        spec: {
            restartPolicy: "Never",
            containers: [
                {
                    name: "tensorflow-runtime",
                    image: "tensorflow/tensorflow:" + tensorflowVersion, // tensorflowVersion
                    env: [
                        {
                            name: "APISERVER_IP",
                            value: process.env.APISERVER_IP
                        },
                        {
                            name: "USERID",
                            value: userId
                        },
                        {
                            name: "WsName",
                            value: WsName
                        },
                        {
                            name: "branch",
                            value: branchName
                        },
                        {
                            // this is the public key for k8s cluster to access apiserver
                            name: "Session_Token",
                            value: credential
                        },
                        {
                            name: "LogPath",
                            value: logPathInContainer
                        }
                    ],
                    imagePullPolicy: "IfNotPresent",
                    command: ["/bin/sh"],
                    args: createBashArgs_BatchUse(commandList), // generat bash args
                    volumeMounts: [
                        {
                            mountPath: '/mnt/',
                            name: "work-space"
                        },
                        {
                            mountPath: "/logs/",
                            name: "log-root"
                        }
                    ],
                    resources: {
                        limits: {
                            'nvidia.com/gpu': GpuNum
                        }
                    }
                }
            ],
            volumes: [
                {
                    name: "work-space",
                    hostPath: {
                        path: root, // workspaceRoot here
                        type: "Directory"
                    }
                },
                {
                    name: "log-root",
                    hostPath: {
                        path: AppLogRoot, // workspaceRoot here
                        type: "Directory"
                    }
                },
            ]
        }
    }

    // 寫入指定資料夾
    let yamlStream = jsYaml.dump(yaml, jsYaml.JSON_SCHEMA)
    let fileHandler = await fsPromise.open(yamalPath, 'w+');
    console.log('start write')
    await fileHandler.writeFile(yamlStream)
    console.log('end write')
    await fileHandler.close();
    return 'success create - ' + yamalPath;
}

function createBashArgs_BatchUse(ScheduleList) {
    let args = ["-c"];
    let shellScript = '';
    // 編輯指令
    // 切換至容器工作區
    shellScript = shellScript.concat('cd /mnt;');
    // 殺出request告知server此pod成功啟動並更新資料庫
    shellScript = shellScript.concat(`curl $APISERVER_IP/users/$USERID/management/api/workRecord/setRunning/$WsName/$branch ;`);
    // 初始化logFile
    shellScript = shellScript.concat('echo "your application log start below..." > $LogPath;');
    for (command of ScheduleList) {
        if(command[0] != '#') {
            shellScript = shellScript.concat(composeCommandFlag(command.command, command.optionMap) + ' >> $LogPath 2>&1;');
        }
        
    }
    // 發出 curl 請求,通知server完成工作
    shellScript = shellScript.concat(`curl $APISERVER_IP/users/$USERID/management/api/workRecord/setFinish/$WsName/$branch ;`);
    // 提示使用者是否執行完畢
    shellScript = shellScript.concat('echo "\nConsole diconnected!..." >> $LogPath;');
    // 結束shell
    // shellScript = shellScript.concat('done');
    args.push(shellScript);
    console.log('finish args set: ')
    console.log(args);
    return args;
}

function composeCommandFlag(command, optionMap) {
    let fullCommand = command;
    for (el of optionMap) {
        if(el.value == 'true' || el.value == 'false' ) {

        }
        else {
            fullCommand = fullCommand + ' ' +  `${el.name}=${el.value}`
        }
    }

    return fullCommand;
}




module.exports = {
    UploadJobToCytus_2, RunBatchWork, deleteFile,loadWorkspaceCach,LoadWSList, cachWorkspace, LS,resetWorkspaceRoot ,CreateUserRootFolder,RunWorkspace,DeleteWorkspace,CreateWorkspace,GenerateYaml,UploadJobToCytus,getFileContentAsString
}

