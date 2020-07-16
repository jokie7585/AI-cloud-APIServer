#!/usr/bin/env node
const {AppError, errorType} = require('../AppError')
const {CytusEvent} = require('./CytusPrototcol')
var context = require('rabbit.js').createContext('amqp://localhost');
const yargs = require('yargs')
const args = yargs.argv
var pub, sub

let podname = args.name || args.n || undefined
let path = args.path || args.p || undefined
let gpuNumber = args.gpu || args.g || undefined
/**
 * this script push a job to Cytus scheduler through MQ
 */

 // init MQ
context.on('ready', function() {
  pub = context.socket('PUB');
  sub = context.socket('SUB');
  sub.on('data', function(note) { 
    let {event, podname:name} = JSON.parse(note) 

    if(event === CytusEvent.JOB_COMFIRM) {
      if( name === podname) {
        let time = new Date();
        console.log(time.toUTCString() + ` In ${podname}'s upload thread - ` + name + ' is comfirmed by Cytus scheduler.');
        context.close();
      }
    }
    
  });
  

  sub.connect('reply', function() {
    pub.connect('upload', function() {
      let payload = {
        event: CytusEvent.JOB_UPLOAD,
        podname: podname, 
        yamlpath:path,
        gpuNumber:gpuNumber
      }
        pub.write(JSON.stringify(payload), 'utf8');
    });
  });
});

context.on('close', function() {
    process.exit(0);
})



/**
 * Deprecate: now use arg-parser to get peremeter
 */
// init reader
// let reader = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// })

// reader.on('line', function(line) {
//     instuction = line
//     pub.write(JSON.stringify({welcome: instuction}), 'utf8');
//     let time = new Date();
//     console.log(time.toUTCString() + ' send upload request success.')
//     reader.close()
//     context.close()
// })

// reader.on('close', function() {
//     let time = new Date();
//     console.log(time.toUTCString() + ' stdin close success.')
// })
