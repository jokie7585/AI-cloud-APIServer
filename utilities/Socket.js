const _ = require('lodash');
const SocketServer = require('ws').Server
const jsonwebtoken = require('jsonwebtoken');
const SECRET = 'YOUR_JWT_SECRET';
const MSC = require('../services/MongoService');

let cetusSocket;
let initMessage = 'success set cetusSocket on req'

class CetusSocket {
    wss;
    clients = {};

      initSocketUseExistServer(server) {
        this.wss = new SocketServer({
            server: server,
            clientTracking:true,
            verifyClient: this.verifyUser,
            perMessageDeflate: {
              zlibDeflateOptions: {
                // See zlib defaults.
                chunkSize: 1024,
                memLevel: 7,
                level: 3
              },
              zlibInflateOptions: {
                chunkSize: 10 * 1024
              },
              // Other options settable:
              clientNoContextTakeover: true, // Defaults to negotiated value.
              serverNoContextTakeover: true, // Defaults to negotiated value.
              serverMaxWindowBits: 10, // Defaults to negotiated value.
              // Below options specified as default values.
              concurrencyLimit: 10, // Limits zlib concurrency for perf.
              threshold: 1024 // Size (in bytes) below which messages
              // should not be compressed.
            }
        });
        
        this.wss.on('connection', (ws, req) => {
            //連結時執行此 console 提示
            console.log('Client connected')
            let Cookie = ParseCookie(req.headers.cookie)
            let jwtPayload = VrifyJWT(Cookie.token)
            this.clients[jwtPayload.username] = {
                jwtPayload: jwtPayload,
                ReqInfo: req,
                socket: ws
            }

            ws.on('message', (data) => {

            })

            ws.on('close', () => {
                for(let client in this.clients) {
                    if(this.clients[client].jwtPayload.username == client) {
                        delete this.clients[client]
                        console.log('Remove Client Disconnect Obj: ' + client)
                        return
                    }
                }
            })
            
            this.listClient();
        })

        //當 WebSocket 的連線關閉時執行
        this.wss.on('close', () => {
            console.log('Close connected')
        })

        console.log('success init CetusSocket.')
      }

      /**
       * socket verifyUser function
       * @param {*} info 
       */

      verifyUser(info, cb) {
        console.log('in verifyUser')
        console.log(info)
        let Cookie = ParseCookie(info.req.headers.cookie)
        if(Cookie.token) {
            cb(true)
            console.log('accept socket connection')
        }
        else{
            cb(false)
            console.log('reject socket connection')
        }
      }

      IsacceptConnection() {

      }


      /**
       * CetusSocket Methode start below
       */

      listClient() {
          console.log({allConnectedClients:this.clients})
      }

      sendJSONres(useerId,resObj) {
        // console.log({targetUser: this.clients[useerId]})
        this.clients[useerId].socket.send(JSON.stringify(resObj))
      }

      // updateComponent makes an component forced update
      updateComponent(useerId,ws, target) {
        this.sendJSONres(useerId, {
            action: 'update',
            body: {
                target:target,
                ws: ws
            }
        })
      }

      // event(message) processor


      pin() {
        console.log('socket here')
      }

      pon() {

      }

}

function initSocketUseExistServer(server) {
    cetusSocket = new CetusSocket();
    cetusSocket.initSocketUseExistServer(server);
}

function updateComponent(useerId,ws, target) {
    cetusSocket.updateComponent(useerId,ws, target)
  }

function sendJSONres(useerId,resObj) {
    cetusSocket.sendJSONres(useerId, {
        action: 'message',
        body: resObj
    });
}

function ParseCookie(cookieStr) {
    if(!cookieStr) {
        return {}
    }
    // if has cookie
    let CoockieArr = cookieStr.split(';')
    let Cookie = {}
    let name_REX = /(.*)\=/
    let value_REX = /\=(.*)/
    CoockieArr.forEach(el => {
        // console.log({ namePars: el.match(name_REX)})
        // console.log({valuePars: el.match(value_REX)})
        Cookie[el.match(name_REX)[1].trim()] = el.match(value_REX)[1].trim()
    });
    // console.log(Cookie)
    return Cookie;
}

function VrifyJWT(jwt) {
    let payload = jsonwebtoken.verify(jwt, SECRET);
    return payload;
}

function pin() {
    cetusSocket.pin()
}


module.exports = {pin,initSocketUseExistServer,sendJSONres, updateComponent}