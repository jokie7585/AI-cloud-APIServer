// nodejs require
var fs = require('fs');
var ph = require('path');
var jsYaml = require('js-yaml')
const fsPromise = fs.promises;
var {spawnSync, execFileSync} = require('child_process')


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
    console.log('volumes path :')
    console.log(workspaceRoot)
    // normlized path in container
    var getLogPathInContainer = new RegExp(/\.secrete.*/);
    let logPathInContainer = logPath.match(getLogPathInContainer)[0];
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
                            mountPath: "/tmp/",
                            name: "work-space"
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
                }
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

function createBashArgs(ScheduleList) {
    let args = ["-c"];
    let shellScript = '';
    // 編輯指令
    // 切換至容器工作區
    shellScript = shellScript.concat('cd /tmp;');
    // 殺出request告知server此pod成功啟動並更新資料庫
    shellScript = shellScript.concat(`curl $APISERVER_IP/users/$USERID/management/api/workRecord/setRunning/$WsName ;`);
    // 初始化logFile
    shellScript = shellScript.concat('echo "your application log start below..." > $LogPath;');
    
    for (command of ScheduleList) {
        shellScript = shellScript.concat(command + ' >> $LogPath 2>&1;');
        
    }
    // 發出 curl 請求,通知server完成工作
    shellScript = shellScript.concat(`curl $APISERVER_IP/users/$USERID/management/api/workRecord/setFinish/$WsName ;`);
    // 提示使用者是否執行完畢
    shellScript = shellScript.concat('echo "\nConsole diconnected!..." >> $LogPath;');
    // 結束shell
    shellScript = shellScript.concat('done');
    args.push(shellScript);
    console.log('finish args set: ')
    console.log(args);
    return args;
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
    
    return WSName
}

async function DeleteWorkspace(payload) {
    let {WSName, UserId} = payload;
    let path = ph.join(process.env.ROOTPATH, UserId, WSName);
    deleteFolderRecursive(path);
    console.log('success recursive delete path: ' + path);
    return WSName;
}

var deleteFolderRecursive = function(path) {
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

  async function UploadJobToCytus(podname,gpunumber, userId, Wsname) {
    let yamlpath = ph.join(process.env.ROOTPATH, userId, 'Workspace', Wsname, '.secrete/podConfig.yaml')
    // let scriptPath = ph.join(process.cwd(), 'utilities/CytusCTL/jobUploader.js')
    // let stdout = execFileSync(scriptPath ,['-n', podname, '-p', yamlpath, '-g', gpunumber], {encoding:'utf-8'})
    // return stdout
    return spawnSync('kubectl', ['create', '-f', yamlpath]);
  }




module.exports = {
    LoadWSList, LS, CreateUserRootFolder,RunWorkspace,DeleteWorkspace,CreateWorkspace,GenerateYaml,UploadJobToCytus
}

