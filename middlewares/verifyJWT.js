const _ = require('lodash');
const jsonwebtoken = require('jsonwebtoken');
const EXPIRES_IN = 6000 * 1000;
const SECRET = 'YOUR_JWT_SECRET';

async function verifyJWT(jwt) {
    if(!jwt) {
        console.log('no session!')
        return Promise.reject(new Error('No JWT'));
    }
    const decoded = jsonwebtoken.verify(jwt, SECRET);
    // async 會把回傳值包在Promise中：等價 Promise.resolve(decoded)
    return decoded;
}

module.exports = function(option = {}) {
    const {tokenPath = 'cookies.token'} = option;
    return function(req, res, next) {
        const jwt = _.get(req, tokenPath);
        verifyJWT(jwt)
            .then(decoded => {
                console.log(decoded.username + ' just sent a request');
                // set req.User
                req.User = decoded.username;
                next();
            })
            .catch(err => {
                req.User = 'Guest';
                next();
            });
    }
}