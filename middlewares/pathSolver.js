const _ = require('lodash');

// 假如有path參數在url中,在req 中新增targetPath屬性(req.params.path&req.params.userId)
module.exports = function(option = {}) {
    const {pathName = 'params.path'} = option;
    return function(req, res, next) {
        console.log('InPathsolver!!')
        let path = _.get(req, pathName);
        if(path) {
            console.log('original: '+path);
            path = path.replace(new RegExp('>>', 'g'),'/');
            path = path.replace('root', '');
            console.log('proccessed: '+path);
            req.targetPath = path;
        }
        next();
    }
}