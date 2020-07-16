const _ = require('lodash');
const ph =require('path')

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
            path = ph.normalize(path)
            let Wsname = path.split('/')[1]
            path = path.split('/').slice(2).join('/');
            path = ph.join( 'Workspace', Wsname, 'AppRoot', path )
            console.log('proccessed: '+ path);
            req.targetPath = path;
        }
        next();
    }
}