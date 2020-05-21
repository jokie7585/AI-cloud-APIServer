// express require
var express = require('express');
var router = express.Router();
const veriftJWT = require('../middlewares/verifyJWT.js')
// 初始化fileSystemRouter
const {createRouter: creatSystemRoter} = require('./workingSpace.js');
var workingSpace = creatSystemRoter();
router.use('/', workingSpace);

/* GET users Profile.回傳公開頁面訊息
    透過 query url 回傳指定公開資料
 */
// get root(repository/workingspaceList) of user
router.get('/:userId', function(req, res, next) {

    // query analysis, send defrriend response data to frontend to render
    if(req.query.tab === 'workingSpace') {
        if(req.User == req.params.userId) {
            if(req.User === 'Guest') {
                // 載入Public頁面/資料
                res.json([]);
            }
            else {
                // 訪問userId的根目錄（WorkingSpace/repository）
                LS(req.params.userId, '/', (payLoad) => {
                    res.json(payLoad);
                })
            }
        }
        else {
            throw new Error('no jwt token, plz login to use your workingSpace')
        }
    }
    else {
        throw new Error('plz set ?tab(url query) on url to invoke users management page')
    }

    
})

module.exports = router;

// working function


