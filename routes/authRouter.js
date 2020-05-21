const express = require('express');
// 初始化jwt設定
const jwt = require('jsonwebtoken');
const EXPIRES_IN = 6000 * 1000;
const SECRET = 'YOUR_JWT_SECRET';
// 初始化自訂服務
const WF = require('../utilities/workingFuction')
const MCS = require('../services/MongoService')

function createRouter(dependencies) {
    // get dependencies
    const {} = dependencies;
    // create a router
    var router = express.Router();  

    // all api start with: '/api/auth'

    /* Post log */
    router.post('/login', function (req, res, next) {
        const data = req.body;
        verifyUser(data)
            .then(payLoad => {
                const token = jwt.sign(payLoad, SECRET, {expiresIn: EXPIRES_IN});
                res.cookie('token', token, {maxAge: EXPIRES_IN, httpOnly:true});
                res.json({
                    token,
                    message:'Success response!'
                });
            })
            .catch(err=> {
                res.status(500).json({
                    message: err
                });
            });
        console.log('async run there!')
    })

    // 註冊API,若註冊失敗則回傳指定訊息提供前端渲染
    router.post('/signUp', function (req, res, next) {
        const data = req.body;
        userSingUp(data)
        .then(doc => {
            console.log('success run sighUp process!')
            console.log(doc)
            res.json({message: 'SignUp success! Now you can Login With your account!'})
        })
        .catch(err=>{
            res.status(401).json({
                message: err
            })
        })
        console.log('async run there!')
    })

    return router;
}

// workerFunction
// --------------------------------------------
async function userSingUp(data) {
    let docInstance = await MCS.singUp(data)
    .then( (doc) => {
        // console.log(doc)
        WF.CreateUserRootFolder(doc.account);
        return Promise.resolve(doc);
    })
    .catch(err => {
        console.log(err)
        // reject with error message
        return Promise.reject(err);
    })

    return docInstance;
}

// 到資料庫查詢是否有這位使用者
async function verifyUser(data) {
    console.log(data);
    const {username, password} = data;

    if(!MCS.isDBAvailible()) {
         // if db not availible, do offLine action.
        if(username === 'billy' && password ==='1234') {
            return Promise.resolve({
                username,
                email: 'billy@gmail.com',
            });
        }
        return Promise.reject(new Error("登入失敗"));
    }
    else{
        // if db availible, do normal action.
        console.log('start query database!')
        let account = await MCS.signIn({account:username, password});
        console.log('end query database!')
        return Promise.resolve({
            username:account,
        });
    }
    
}

module.exports ={
    createRouter
};