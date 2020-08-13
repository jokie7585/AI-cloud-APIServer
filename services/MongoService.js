const mongoose = require('mongoose')
const Modle_UserData = require('./dao/UserData_Schema')
const url = process.env.MongoIp || 'mongodb://localhost:27017/myAICloud-Database';
const ph = require('path')
let db;
let isDBOn = false;

function init() {
    mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
    .catch(err => {
        isDBOn = false;
        console.log('mongoose connect failed!')
    });
    // 設定監聽事件
    db = mongoose.connection;
    db.on('error', console.error.bind(console, 'mongoose connect failed'))
    db.once('open', function() {
        isDBOn = true;
        console.log('mongoose connect successfully')
    })
}

function isDBAvailible() {
    if(isDBOn) return true;
    return false;
}

// 註冊用
async function singUp({account,password}) {
    
    if(!await Modle_UserData.exists({account: account})) {
        var newData = new Modle_UserData({
            account: account,
            password: password,
            rootPath: ph.join(process.env.ROOTPATH, account)
        });
        return await newData.save();
    }
    else{
        return Promise.reject('This username is already exist.')
    }
}

// if has the account record in database, than check is password is correct
async function signIn({account,password}) {
    console.log('query database!')
    if(await Modle_UserData.exists({account: account})) {
        console.log(account + ' exist!');
        let doc = await Modle_UserData.findOne({account:account});
        console.log(doc);
        if(doc.isUser({account,password})) {
            console.log(account + ' exist!And password correct!')
            return Promise.resolve(account);
        }
        else{
            return Promise.reject('Are you ' + account + '? plz check your password!')
        }
    }
    else{
        console.log(account + ' not exist!')
        return Promise.reject('This account is not exist!')
    }
    
}

// getDocument
async function getdocInstance({account}) {
    console.log('query database!')
    if(await Modle_UserData.exists({account: account})) {
        console.log(account + ' exist!');
        let doc = await Modle_UserData.findOne({account:account});
        console.log(doc);
        return Promise.resolve(doc);
    }
    else{
        console.log(account + ' not exist!')
        return Promise.reject('This account is not exist in database!')
    }
    
}




module.exports = {
    init, singUp, signIn, isDBAvailible, getdocInstance
};