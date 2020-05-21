const express = require('express');
const multer = require('multer');
const path = require('path')
const veriftJWT = require('../middlewares/verifyJWT.js');
const pathSolver = require('../middlewares/pathSolver.js');
const {LS, CreateWorkspace, GenerateYaml,RunWorkspace} = require('../utilities/workingFuction.js');
const MCS = require('../services/MongoService')


function createRouter(dependencies = {}) {
    // get dependencies
    const {} = dependencies;
    // create a router
    var router = express.Router();  
    // 初始化multer's disk storage setting
    var storage = multer.diskStorage({
        destination: function (req, file, callBack) {
            console.log(req.targetPath)
            let targetPath = req.targetPath.replace('root', '');
            console.log('StoragePath: '+process.env.ROOTPATH + req.params.userId + '/' +targetPath);
            callBack(null, process.env.ROOTPATH + req.params.userId + '/' + targetPath)
        },
        filename: function (req, file, callBack) {
            callBack(null, file.originalname);
        }
    })
    // 初始化multer
    var upload = multer({storage: storage})

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
                .then((mes)=> {
                    res.json({
                        message:'Success Created workspace: ' + WSName
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
                    let {tensorflowVersion,GpuNum} = doc.getConfig({WsName:req.params.workspaceName});
                    res.json({
                        tensorflowVersion:tensorflowVersion,
                        GpuNum:GpuNum
                    })
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

    // 執行workspace
    router.get('/:userId/management/api/runWorkspace/:workspaceName',veriftJWT(), pathSolver(),function(req, res, next) {
        //let staticPath = path.join(process.env.ROOTPATH, req.params.userId, req.targetPath, req.params.filename);
        console.log(req.User + ' start run! :' + req.params.workspaceName )
        MCS.getdocInstance({account:req.User})
                .then(doc => {
                    let payLoad = {
                        userId: req.User,
                        config: doc.getConfig({WsName: req.params.workspaceName}),
                        scheduleList: doc.getscheduleList({WsName: req.params.workspaceName}),
                        WsName: req.params.workspaceName,
                        credential: req.cookies.token
                    }
                    console.log('get data from database:')
                    console.log(payLoad)
                    GenerateYaml(payLoad)
                    .then(message => {
                        let payLoad = {
                            userId: req.User,
                            WsName: req.params.workspaceName
                        }
                        // run childprocess : run script
                        RunWorkspace(payLoad)
                        .then((message)=> {
                            console.log(message)
                            res.json({
                                message: 'success run workspace! We will notify you when work is success or fail!',
                                WsName: req.params.workspaceName
                            })
                        })
                        .catch(err => {
                            console.log(err.toString())
                            res.status(500).json({
                                message: 'failed to run workspace!',
                                WsName: req.params.workspaceName
                            })
                        })
                        // async log GenerateYaml's message here
                        console.log(message);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            message: 'server side error occurs, plz contact us!'
                        })
                    })
                
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        message: 'server side error occurs, plz contact us!'
                    })
                })

        console.log('async end routine but still run!')
    })

    // get dir(repository/workingspaceList) include root of user
    router.get('/:userId/:path',veriftJWT(),pathSolver(),function(req, res, next) {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                throw new Error('Guest can not use fileSystem.LS');
            }
            else {
                // 訪問userId的根目錄（WorkingSpace/repository）
                console.log('targetPath: '+req.targetPath);
                LS(req.params.userId, '/' +req.targetPath, (payLoad)=> {
                    res.json(payLoad)
                })
                
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    })

    // create new folder at given path, than reponse message
    router.post('/:userId/:path/mkdir',veriftJWT(), pathSolver(), upload.array('uploadFile'),function(req, res, next) {
        // call working function here
    })

    // get root(repository/workingspaceList) of user
    router.post('/:userId/:path/upload',veriftJWT(), pathSolver(), upload.array('uploadFile'),function(req, res, next) {
        // query analysis, send defrriend response data to frontend to render
        LS(req.params.userId, '/'+req.targetPath, (payLoad) => {
            res.json(payLoad);
        })
    })

    // process downoad
    router.get('/:userId/:path/:filename/download',veriftJWT(), pathSolver(),function(req, res, next) {
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