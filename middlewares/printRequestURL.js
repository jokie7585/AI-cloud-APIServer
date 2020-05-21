function printURL(req, res, next){
    console.log(req.originalUrl);
    next();    
}

module.exports = printURL;