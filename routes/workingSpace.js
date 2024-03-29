const express = require('express');
const multer = require('multer');
const path = require('path')
const fs = require('fs')
const veriftJWT = require('../middlewares/verifyJWT.js');
const pathSolver = require('../middlewares/pathSolver.js');
const {UploadJobToCytus_2,RunBatchWork,deleteFile,loadWorkspaceCach,cachWorkspace,resetWorkspaceRoot, LS,LoadWSList,getFileContentAsString , DeleteWorkspace,CreateWorkspace, GenerateYaml,UploadJobToCytus} = require('../utilities/workingFuction.js');
const MCS = require('../services/MongoService')
const {AppError, errorType} = require('../utilities/AppError');
const Socket = require('../utilities/Socket');
let {UploadJobToSceduler, RemovefromSceduler} = require('../utilities/CytusCTL/Cytus');
const Cytus = require('../utilities/CytusCTL/Cytus');

function createRouter(dependencies = {}) {
    // get dependencies
    const {} = dependencies;
    // create a router
    var router = express.Router();  
    // 初始化multer's disk storage setting
    var storage = multer.diskStorage({
        destination: function (req, file, callBack) {
            console.log(req.targetPath)
            console.log('StoragePath: '+process.env.ROOTPATH + req.params.userId + '/' + req.targetPath);
            req.multerdestination = process.env.ROOTPATH + req.params.userId + '/' + req.targetPath;
            callBack(null, process.env.ROOTPATH + req.params.userId + '/' + req.targetPath)
        },
        filename: function (req, file, callBack) {
            let relativePath = file.originalname.split('/');
            console.log('filePathFromUserhost: ' + file.originalname)
            relativePath = relativePath.slice(0, relativePath.length-1);
            console.log(relativePath)
            if(relativePath.length > 0) {
                let processedPath = path.join(req.multerdestination, ...relativePath);
                fs.mkdir(processedPath, {recursive: true}, err => {
                    // do Nothing
                })
                callBack(null, file.originalname.split('/').slice(1).join('/'));
            }
            else {
                callBack(null, file.originalname);
            }
        }
    })
    // 初始化multer
    var upload = multer({storage: storage, preservePath: true})

    // 新增workspace
    router.post('/:userId/management/api/createWorkspace', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // req.body is json data, contain new workspace name
                let {WSName} = req.body;
                let payLoad={WSName, UserId: req.params.userId}
                console.log(payLoad)
                console.log('start create workspace')
                CreateWorkspace(payLoad)
                .then((newWSName)=> {
                    MCS.getdocInstance({account:req.params.userId})
                    .then(doc => {
                        doc.CreateWorkspaceRecord({WsName:newWSName});
                        doc.save()
                        .then(doc => {
                            console.log('Success Created workspace');
                            console.log(doc);
                            res.json({
                                message:'Success Created workspace: ' + WSName
                            })
                        })
                        .catch(err=> {
                            console.log(err)
                            res.status(500).json({
                                message: 'there might be serverSide error!'
                            })
                        })
                        
                    })
                })
                .catch((err)=> {
                    console.log(err)
                    res.status(400).json({
                        message: err
                    })
                })
                console.log('async run start')
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.post('/:userId/management/api/deleteWorkspace', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                console.log({apiQuery:req.User, JWT:req.params.userId})
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // req.body is json data, contain new workspace name
                let {WsName} = req.body;
                let payLoad={WSName:WsName, UserId: req.params.userId}
                console.log('startDleteWs:')
                console.log(payLoad);
                DeleteWorkspace(payLoad)
                .then(targetWsName => {
                    console.log('success delete from disk')
                    MCS.getdocInstance({account:req.params.userId})
                    .then(doc=>{
                        doc.DeleteWorkspaceRecord({WsName:targetWsName});
                        doc.save()
                        .then(doc=>{
                            console.log('success delete from workspaceSet')
                            console.log(doc);
                            res.json({
                                message:'Success delete workspace: ' + targetWsName
                            })
                        })
                        .catch(err=>{
                            console.log('fail to delete from workspaceSet')
                            console.log(err)
                        })
                    })
                    .catch(err=>{
                        console.log(err)
                        res.status(500).json({
                            message: 'there might be serverSide error!'
                        })
                    })
                })
                .catch(err=>{
                    console.log(err)
                    res.status(500).json({
                        message: 'there might be serverSide error!'
                    })
                })
                
                console.log('async run start')
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })


    router.get('/:userId/management/api/resetWorkspaceRoot/:Wsname', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                console.log({apiQuery:req.User, JWT:req.params.userId})
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                let wsname = req.params.Wsname;
                resetWorkspaceRoot(req.User, wsname)
                .then(() => {
                    res.json({
                        message: 'success delete!'
                    })
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })


    router.get('/:userId/management/api/cachWorkspaceRoot/:Wsname', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                console.log({apiQuery:req.User, JWT:req.params.userId})
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                let wsname = req.params.Wsname;
                cachWorkspace(req.User, wsname)
                .then(() => {
                    res.json({
                        message: 'success delete!'
                    })
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/loadCachasWorkspaceRoot/:Wsname', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                console.log({apiQuery:req.User, JWT:req.params.userId})
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                let wsname = req.params.Wsname;
                loadWorkspaceCach(req.User, wsname, (payload) => {
                    res.json(payload)
                })
                .catch(err => {
                    console.log(err)
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })


     router.post('/:userId/management/api/SetWorkspaceConfig/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                MCS.getdocInstance({account:req.User})
                .then(doc=> {
                    // process here
                    console.log('process workspaceconfif:')
                    let payload = {
                        WsName: req.params.workspaceName,
                        payload: req.body
                    }
                    doc.setConfig(payload);
                    doc.save()
                    .then(instance=>{
                        console.log('doc save Success:')
                        console.log(instance)
                        res.json({
                            message:'success set config!'
                        })
                    })
                    .catch(err=> {
                        console.log('doc save failed')
                        console.log(instance)
                        res.status(500).json({
                            message:'failed to set config!Plz contact us to fixed that problems!'
                        })
                    })
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/getWorkspaceConfig/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                MCS.getdocInstance({account:req.User})
                .then(doc=> {
                    // process here
                    console.log('process get workspace config:')
                    res.json(doc.getConfig({WsName:req.params.workspaceName}))
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.post('/:userId/management/api/SetWorkspaceSchedulList/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // process here
                MCS.getdocInstance({account:req.User})
                .then(doc => {
                    let payload = {
                        WsName: req.params.workspaceName,
                        payload: req.body
                    }
                    doc.setscheduleList(payload);
                    doc.save()
                    .then(instance=> {
                        console.log('doc save Success:')
                        console.log(instance)
                        res.json({
                            scheduleList: instance.getscheduleList({WsName:req.params.workspaceName}),
                            message:'success set scheduleList!'
                        })
                    })
                    .catch(err=>{
                        res.status(500).json({
                            message:'server side error occur, plz contact us!'
                        })
                        console.log(err)
                    })
                })
            
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/getWorkspaceSchedulList/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // process here
                MCS.getdocInstance({account:req.User})
                .then(doc => {
                    res.json({
                        schedulList:doc.getscheduleList({WsName:req.params.workspaceName})
                    });
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })


    router.post('/:userId/management/api/setWorkspaceCommandList/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // process here
                MCS.getdocInstance({account:req.User})
                .then(doc => {
                    let {commandList} = req.body;
                    let payload = {
                        commandList:commandList
                    }
                    doc.setcommandList({
                        WsName:req.params.workspaceName,
                        payload:payload
                    })
                    doc.save()
                    .then(instance => {
                        console.log('success save change of set commandList!')
                        res.json({
                            
                            schedulList:doc.getcommandList({WsName:req.params.workspaceName})
                        });
                    })
                    .catch(err=> {
                        console.log(err);
                        res.status(502).json({
                            message:'serverside error occurs plz contact us'
                        })
                    })
                    
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })


    router.get('/:userId/management/api/getWorkspaceCommandList/:workspaceName/:branch', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                if(req.params.branch == 'Template') {
                    // process here
                    MCS.getdocInstance({account:req.User})
                    .then(doc => {
                        let {commandList, lastUpdate} = doc.getcommandList({WsName:req.params.workspaceName})
                        res.json({
                            commandList:commandList,
                            lastUpdate: lastUpdate
                        });
                    })
                    .catch(err=> {
                        res.status(502).json({
                            message:err
                        })
                    })
                }
                else {
                    // process here
                    MCS.getdocInstance({account:req.User})
                    .then(doc => {
                        res.json({
                            commandList:doc.getBranchcommandList({WsName:req.params.workspaceName, branch: req.params.branch})
                        });
                    })
                    .catch(err=> {
                        res.status(502).json({
                            message:err
                        })
                    })
                }
                
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    /**
     * Branch Management API
     */

    router.post('/:userId/management/api/setBatchConfig/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // process here
                MCS.getdocInstance({account:req.User})
                .then(doc => {
                    let payload = {
                        WsName:req.params.workspaceName,
                        newConfig: req.body,
                    }
                    let newConfig = doc.updateBatchConfig(payload)
                    doc.save()
                    .then(instance => {
                        console.log('success save change of set commandList!')
                        res.json(newConfig);
                    })
                    .catch(err=> {
                        console.log(err);
                        res.status(502).json({
                            message:'serverside error occurs plz contact us'
                        })
                    })
                    
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/getBatchConfig/:workspaceName', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // process here
                MCS.getdocInstance({account:req.User})
                .then(doc => {
                    res.json(
                        doc.GetBatchConfig({WsName:req.params.workspaceName})
                    );
                })
                .catch(err=> {
                    console.log(err)
                    res.status(502).json({
                        message:err
                    })
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/Branch/delete/:branch', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            // delete branch record and root
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    // 執行workspace
    router.get('/:userId/management/api/runWorkspace/:workspaceName',veriftJWT(), pathSolver(),function(req, res, next) {
        //let staticPath = path.join(process.env.ROOTPATH, req.params.userId, req.targetPath, req.params.filename);
        console.log(req.User + ' start run! :' + req.params.workspaceName )
        MCS.getdocInstance({account:req.User})
                .then(doc => {
                    // generate new workRecord of the workspace
                    let newRecord = doc.CreateWorkRecord({WsName:req.params.workspaceName});
                    // start generate yaml
                    console.log('start create YAML')
                    let payLoad = {
                        userId: req.User,
                        config: doc.getConfig({WsName: req.params.workspaceName}),
                        scheduleList: doc.getscheduleList({WsName: req.params.workspaceName}),
                        commandList: doc.getcommandList({WsName: req.params.workspaceName}).commandList,
                        WsName: req.params.workspaceName,
                        credential: req.cookies.token,
                        logPath: newRecord.logPath,
                        podName: newRecord.podName,
                    }
                    
                    GenerateYaml(payLoad)
                    .then(message => {
                        // new code
                        let config = doc.getConfig({WsName: req.params.workspaceName})

                        let jobinfo = {
                            userId: req.params.userId,
                            workspace: req.params.workspaceName,
                            branch: 'Template',
                            podName: newRecord.podName,
                            yamlPath: path.join(process.env.ROOTPATH, req.params.userId, 'Workspace', req.params.workspaceName, '.secrete/podConfig.yaml'),
                            gpuRequest: config.GpuNum,
                            CpuRequest: config.CpuRequest,
                            MemoryRequest: config.MemoryCapacity
                        }

                        
                        UploadJobToSceduler([jobinfo])
                        .then((msg) => {
                            doc.save()
                            .then(() => {
                                res.json({
                                    message: 'successful submit jub to Cytus!'
                                })
                            })
                        })
                        .catch((err) => {
                            console.log(err.toString())
                            res.status(500).json({
                                message: 'server side error occurs, plz contact us!'
                            })
                        })
                        // new code end

                        // oldcode start
                        // run fake jobUploader
                        // let {podName, userId, WsName, config} = payLoad
                        // UploadJobToCytus(podName, config.GpuNum, userId, WsName)
                        // .then((msg) => {
                        //     console.log(msg.stdout.toString());
                        //     console.log(msg.stderr.toString());
                        //     doc.save()
                        //     .then(() => {
                        //         res.json({
                        //             message: 'successful submit jub to Cytus!'
                        //         })
                        //     })
                        // })
                        // .catch((err) => {
                        //     console.log(err.toString())
                        //     res.status(500).json({
                        //         message: 'server side error occurs, plz contact us!'
                        //     })
                        // })
                        // // async log GenerateYaml's message here
                        // console.log(message);
                    })
                    .catch(err => {
                        console.log(err.toString());
                        res.status(500).json({
                            message: 'server side error occurs, plz contact us!'
                        })
                    })
                
                })
                .catch(err => {
                    console.log(err.toString());
                    res.status(500).json({
                        message: 'server side error occurs, plz contact us!'
                    })
                })

        console.log('async end routine but still run!')
    })

    router.get('/:userId/management/api/runBatch/:workspaceName',veriftJWT(), pathSolver(),function(req, res, next) {
        //let staticPath = path.join(process.env.ROOTPATH, req.params.userId, req.targetPath, req.params.filename);
        console.log(req.User + ' start run! :' + req.params.workspaceName )
        MCS.getdocInstance({account:req.User})
                .then(doc => {
                    // generate new workRecord of the workspace
                    let newRecord = doc.CreateWorkRecord({WsName:req.params.workspaceName});
                    // start generate yaml
                    console.log('start create YAML')
                    let payLoad = {
                        userId: req.User,
                        config: doc.getConfig({WsName: req.params.workspaceName}),
                        scheduleList: doc.getscheduleList({WsName: req.params.workspaceName}),
                        // commandList: doc.getcommandList({WsName: req.params.workspaceName}),
                        WsName: req.params.workspaceName,
                        credential: req.cookies.token, // inner System private access key
                        // logPath: newRecord.logPath,
                        // podName: newRecord.podName,
                        batchset: doc.GetBatchConfig({WsName: req.params.workspaceName}).branchSet,
                    }
                    
                    RunBatchWork(payLoad)
                    .then(newbranchset => {
                        // "newbranchset" 內所有的工作都上傳到Cetus
                        // new code
                        let config = doc.getConfig({WsName: req.params.workspaceName})

                        newbranchset.forEach(el => {
                            let jobinfo = {
                                userId: req.params.userId,
                                workspace: req.params.workspaceName,
                                branch: el.branchName,
                                podName: el.podName,
                                yamlPath: el.yamalPath,
                                gpuRequest: config.GpuNum,
                                CpuRequest: config.CpuRequest,
                                MemoryRequest: config.MemoryCapacity
                            }
    
                            
                            UploadJobToSceduler([jobinfo])
                            .then((msg) => {
                                // console.log(msg.stdout.toString());
                                // console.log(msg.stderr.toString());
                                
                            })
                            .catch((err) => {
                                console.log(err.toString())
                                throw new Error('UploadJobToSceduler fail')
                            })
                        })

                        doc.save()
                            .then(() => {
                                res.json({
                                    message: 'successful submit jub to Cytus!'
                                })
                            })
                       
                        // new code end
                        /**
                         *  ~ <Code> ~
                         */
                        // run fakejobUploader
                        // UploadJobToCytus_2(newbranchset)
                        // .then( msg => {
                        //     console.log(msg);
                        //     doc.save()
                        //     .then(() => {
                        //         res.json({
                        //             message: 'successful submit batch to Cytus!'
                        //         })
                        //     })
                        //     .catch(err => {
                        //         console.log(err)
                        //     })
                        // })
                        // .catch((err) => {
                        //     console.log('fail push batch to Cetus');
                        //     console.log(err.toString())
                        //     res.status(500).json({
                        //         message: 'server side error occurs, plz contact us!'
                        //     })
                        // })
                    })
                    .catch(err => {
                        console.log(err.toString());
                        res.status(500).json({
                            message: 'server side error occurs, plz contact us!'
                        })
                    })
                
                })
                .catch(err => {
                    console.log(err.toString());
                    res.status(500).json({
                        message: 'server side error occurs, plz contact us!'
                    })
                })

        console.log('async end routine but still run!')
    })

    // only return the newest log, and notify is pod finished yet.
    router.get('/:userId/management/api/getWorkspaceLog/:workspaceName/:branch', veriftJWT(), function( req,res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('denying request');
            }
            else {
                // process here
                MCS.getdocInstance({account:req.User})
                .then(doc => {
                    // 取得該user的doc後取出最新的pod的workrecords
                    let record = undefined;
                    if(req.params.branch == 'Template') {
                        record = doc.Get_LastPod_Record({WsName:req.params.workspaceName});
                    }
                    else {
                        record = doc.Get_Branch_Record({WsName:req.params.workspaceName, branch:req.params.branch});
                    }
                    console.log('Lastest records is:')
                    console.log(record);
                    if(record) {
                        let{status,logPath } = record;
                        // has workpod to logs data
                        if(status === 'completed') {
                            res.set({
                                'X-AICLOUD-ENDLOG' : true
                            })
                            getFileContentAsString(logPath, (data) => {
                                res.send({logs: data})
                            })
                            .catch((err) => {
                                console.log(err);
                            })
                        }
                        else if (status === 'running') {
                            res.set({
                                'X-AICLOUD-ENDLOG' : false
                            })
                            getFileContentAsString(logPath, (data) => {
                                res.send({logs: data})
                            })
                            .catch((err) => {
                                console.log(err);
                            })
                        }
                        else if (status === 'pending') {
                            res.set({
                                'X-AICLOUD-ENDLOG' : true
                            })
                            res.status(500).json({
                                message: "this workspace is in cetus but waiting to prepare dependency , there are no logs to show!\nwe will notify you when your job start!"
                            })
                        }
                        else if (status === 'waiting') {
                            res.set({
                                'X-AICLOUD-ENDLOG' : true
                            })
                            res.status(500).json({
                                message: "this workspace is in cetus scheduler(there are no resources for your app), there are no logs to show!\nwe will notify you when your job start!"
                            })
                        }
                        
                        
                    }
                    else {
                        res.status(500).json({
                            message: "this workspace never run, there are no logs to show!\nplz run workspace first!"
                        })
                    }

                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/workRecord/setRunning/:workspaceName/:branch', function( req,res, next) {
        MCS.getdocInstance({account: req.params.userId})
        .then( doc => {
            let newRecord = undefined;
            if(req.params.branch == 'Template'){
                newRecord = doc.Set_LastPod_Running({WsName: req.params.workspaceName});
            }
            else{
                newRecord = doc.Set_Batch_Branch_Running({WsName: req.params.workspaceName, branch:req.params.branch});
            }
            if(newRecord) {
                doc.save()
                .then(doc=>{
                    console.log('set record running:')
                    console.log(newRecord)
                    Socket.updateComponent(req.params.userId,doc.GetBatchConfig({WsName: req.params.workspaceName}), 'batchComponent')
                    res.send();
                })
                .catch(err=>{
                    console.log('database error : failed to resolve  Set_LastPod_Finished ');
                    console.log(err);
                    res.send();
                })
            }
            else {
                console.log('that might be an unexpected request from invailid host!!')
                res.status(500).json({
                    message: 'that might be an unexpected request from invailid host!!'
                })
            }
            
        })
        .catch(err=>{
            console.log(err);
            res.status(500).json({
                message: 'that might be an unexpected request from invailid host!!'
            })
        })
    })

    // this api only accept k8s cluster to call, should check the orign
    router.get('/:userId/management/api/workRecord/setFinish/:workspaceName/:branch', function( req,res, next) {
        MCS.getdocInstance({account: req.params.userId})
        .then( doc => {
            let newRecord;
            if(req.params.branch == 'Template') {
                newRecord = doc.Set_LastPod_Finished({WsName: req.params.workspaceName});
            }
            else {
                newRecord = doc.Set_Batch_Branch_Finished({WsName: req.params.workspaceName, branch:req.params.branch});
            }
            // if setted doc.save();
            if(newRecord) {
                doc.save()
                .then(doc=>{
                    console.log('set record finished:')
                    console.log(newRecord)
                    RemovefromSceduler(newRecord)
                    Socket.updateComponent(req.params.userId,doc.GetBatchConfig({WsName: req.params.workspaceName}), 'batchComponent')
                    res.send();
                })
                .catch(err=>{
                    console.log('database error : failed to resolve  Set_LastPod_Finished ');
                    console.log(err);
                    res.send();
                })
            }
            else {
                console.log('that might be an unexpected request from invailid host!!')
                res.status(500).json({
                    message: 'that might be an unexpected request from invailid host!!'
                })
            }
            
        })
        .catch(err=>{
            console.log(err);
            res.status(500).json({
                message: 'that might be an unexpected request from invailid host!!'
            })
        })
    })

    // get dir(repository/workingspaceList) include root of user
    router.get('/:userId/:path/:branch',veriftJWT(),pathSolver(),function(req, res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // 訪問userId的根目錄（WorkingSpace/repository）
                console.log('targetPath: '+req.targetPath);
                LS(req.params.userId, req.targetPath, (payLoad)=> {
                    res.json(payLoad)
                })
                
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/management/api/loadWorkspaceList',veriftJWT(),function(req, res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                Socket.sendJSONres(req.User, 'socket msg: on list WorkspaceList')
                // 訪問userId的根目錄（WorkingSpace/repository）
                LoadWSList(req.params.userId, (payLoad)=> {
                    res.json(payLoad)
                })
                
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    router.get('/:userId/get_notification',veriftJWT(),function(req, res, next) {
        MCS.getdocInstance({account: req.params.userId})
        .then(doc => {
            res.json(doc.GetNotification());
        })
    })

    // create new folder at given path, than reponse message
    router.post('/:userId/:path/mkdir',veriftJWT(), pathSolver(),function(req, res, next) {
        // call working function here
    })

    // get root(repository/workingspaceList) of user
    router.post('/:userId/:path/upload/:branch',veriftJWT(), pathSolver(), upload.array('uploadfiles'), function(req, res, next) {
        // process upload request
        // 簽發Upload專用的token(包含每個檔案的相對路徑與此次上傳的根路徑)
        LS(req.params.userId, req.targetPath, (data)=> {
            res.json(data)
        })
        
    })

    router.post('/:userId/management/api/deleteFile',veriftJWT(), function(req, res, next) {
        let {WsName,relativepath,filename } = req.body;
        deleteFile(req.params.userId, WsName, relativepath,  filename)
        .then((payload)=> {
            res.json(payload)
        })
        .catch(err => {
            console.log('errors in deleteUploadTempFile!')
            console.log(err)
            res.status(500).json({message: 'errors in deleteUploadTempFile!'})
        })
        
    })

    // process downoad
    router.get('/:userId/:path/:filename/download/:branch',veriftJWT(), pathSolver(),function(req, res, next) {
        let staticPath = path.join(process.env.ROOTPATH, req.params.userId, req.targetPath, req.params.filename);
        res.download(staticPath, req.params.filename, (err)=> {
            if(err) return console.log(err);
        })
        console.log('download from' + staticPath)
    })
    

    return router;
}

module.exports ={
    createRouter
};


// script


// working function