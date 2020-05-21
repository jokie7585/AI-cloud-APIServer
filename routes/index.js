var express = require('express');
const veriftJWT = require('../middlewares/verifyJWT.js')

function creatRouter(dependencies) {
  // Get dependencies
  const {mongoService, authRoter} = dependencies;

  // creat router 
  var router = express.Router();
  // 串連身份驗證api
  router.use('/api/auth', authRoter);

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

  /* my first api */
  router.get('/api/sayHi', veriftJWT(), function(req, res, next) {
    res.send('Welcome back : ' + req.User);
  })

  // 將資料存入mongodb
  router.post('/api/echo', function(req, res, next){
    const body = req.body;
    mongoService.insertEcho(body)
      .then(() => {
        res.json(body);
      })
      .catch(next);

    
  }) 

  router.get('/api/mongo', function(req, res, next){
    mongoService.isConnected()
      .then(isConnected => {
        res.json({isConnected});
      })
      .catch(next);
  })

  return router;


}

module.exports = {creatRouter};