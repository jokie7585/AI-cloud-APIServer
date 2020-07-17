#!/usr/bin/env node
const {CytusEvent} = require('./CytusPrototcol')
const ph = require('path')
const fs = require('fs').promises
const yargs = require('yargs')
const args = yargs.argv
var context = require('rabbit.js')

let root = args.root || args.r || process.cwd()

let config;
let scheduler;


class ScedulList {
    constructor(config) {
        let {nodeAvailible} = config;
        this.list = []

        // init list
        let maxgpu = 0;
        nodeAvailible.forEach(element => {
            if( maxgpu < element.gpuNumber ) {
                maxgpu = element.gpuNumber;
            }
        });
        for( let i = 0; i <= maxgpu; i++) {
            this.list.push(new JobQueue())
        }

        let time = new Date();
        console.log(time.toUTCString() + ` Init scheduleList, now \x1b[32m${nodeAvailible.length}\x1b[0m node are availible.`)
    }

    insert(Job){
        let{gpuNumber} = Job;
        this.list[gpuNumber].insert(Job)
        
    }

    List(){
        let msg = '';
        msg = msg + 'requsetGPU\tJobList\n';
        this.list.forEach((el, index) => {
            msg = msg + `${index}\t${el.toString()}\n`
        })
        console.log(msg )
    }
}

class JobQueue {
    constructor() {
        this.queue = []
    }

    insert(Job) {
        this.queue.push(Job)
    }

    toString(){
        let list = ''
        this.queue.forEach(el => {
            list = list + `${el.podname} `
        })
        return list
    }
}

function initMQ() {
    let MQ = context.createContext('amqp://localhost');
    // init MQ
    MQ.on('ready', function() {
      pub = MQ.socket('PUB');
      sub = MQ.socket('SUB');
      // sub.pipe(process.stdout);
      sub.setEncoding('utf8');
      sub.on('data', function(note) { 
        let data = JSON.parse(note)
        let {event} = data
        let time = new Date();
        if(event === CytusEvent.JOB_UPLOAD) {
          let {podname} = data;
          console.log(time.toUTCString() + ` \x1b[32m${podname}\x1b[0m just push a Job.`); 
          scheduler.insert(data)
          scheduler.List()
          pub.write(JSON.stringify({event: CytusEvent.JOB_COMFIRM,podname: podname}), 'utf8');
        }
        else if (event === CytusEvent.SCHDULER_LISTALL) {
            console.log(time.toUTCString() + ' \x1b[32mCytus\x1b[0m :Cytus deamon says: ListAll')
            scheduler.List()
        }
        else {
          console.log(note)
        }
    });
  
    sub.connect('upload', function() {
      pub.connect('reply', function() {
          let time = new Date();
          console.log(time.toUTCString() + ' \x1b[32mCytus\x1b[0m :Sheduler is connected to MQ.')
      });
    });
  });
  
  MQ.on('close', function() {
    let time = new Date();
    console.log(time.toUTCString() + ' \x1b[32mCytus\x1b[0m :Sheduler is disconnected from MQ.')
    process.exit(0);
  })

}
 
async function initWorkspace() {
    // 初始化獲確認workspace已建立
    await fs.mkdir(ph.join(root, 'CytusScheduler'))
    .then(() => {
        fs.mkdir(ph.join(root, 'CytusScheduler', 'data'))
        fs.mkdir(ph.join(root, 'CytusScheduler', 'logs'))
        fs.mkdir(ph.join(root, 'CytusScheduler', 'Monitor'))
        initVertualConfig()
        .then(() => {
          scheduler = new ScedulList(config);
          let time = new Date();
          console.log(time.toUTCString() + ' \x1b[32mCytus\x1b[0m :workspace is create, sheduler is running.')
        })
        .catch((err )=> {
          console.log(err)
          require('./utitlity/deleteFolder.js')(ph.join(root, 'CytusScheduler'))
          let time = new Date();
          console.log(time.toUTCString() + ' \x1b[32mCytus\x1b[0m :error occure when init workspace, undo init.')
        })

    })
    .catch(err => {
        ReadConfig();
        let time = new Date();
        console.log(time.toUTCString() + ' \x1b[32mCytus\x1b[0m :workspace is checked, sheduler is running.')
    })

}

async function initConfig() {
    /**
     * nodeAvailible = [{nodename, Joblist, gpuNumber}, ....] // at nodeAvailible[n] means has n Gpu availibel
     * nextJob       = {podname, gpuNumber, targetNode}
     */
    config = {
        configPath: ph.join(root, 'CytusScheduler', 'Monitor', 'config.conf'),
        nodeAvailible: [],
        nextJob:[],
    }

    let fileHandler = await fs.open(config.configPath, 'w+');
    await fileHandler.writeFile(JSON.stringify(config));
    await fileHandler.close();
    let time = new Date();
    console.log(time.toUTCString() + ' Init config, now \x1b[32m0\x1b[0m node are availible. Plz add node.')
}

async function initVertualConfig() {
    /**
     * nodeAvailible = [{nodename, Joblist, gpuNumber}, ....] // at nodeAvailible[n] means has n Gpu availibel
     * nextJob       = {podname, gpuNumber, targetNode}
     */
    config = {
        configPath: ph.join(root, 'CytusScheduler', 'Monitor', 'config.conf'),
        nodeAvailible: [{nodename:'test', Joblist:[], gpuNumber:1}, {nodename:'test2', Joblist:[], gpuNumber:2}, {nodename:'test3', Joblist:[], gpuNumber:3}, {nodename:'test4', Joblist:[], gpuNumber:4},{nodename:'test5', Joblist:[], gpuNumber:5}, {nodename:'test6', Joblist:[], gpuNumber:6}, {nodename:'test7', Joblist:[], gpuNumber:7} , {nodename:'test8', Joblist:[], gpuNumber:8}],
        nextJob:[],
    }

    let fileHandler = await fs.open(config.configPath, 'w+');
    await fileHandler.writeFile(JSON.stringify(config));
    await fileHandler.close();
}

async function WriteConfig() {

    let fileHandler = await fs.open(config.configPath, 'w+');
    await fileHandler.writeFile(JSON.stringify(config));
    await fileHandler.close();

    let time = new Date();
    console.log(time.toUTCString() + ' Success write out config.')
}

async function ReadConfig() {

    let fileHandler = await fs.open(config.configPath, 'w+');
    await fileHandler.readFile({encoding:'utf-8'})
    .then((data) => {
        config = JSON.parse(data);
        scheduler = new ScedulList(config);
    })
    .catch(err => {
        console.log(err)
    })
    await fileHandler.close();

    let time = new Date();
    console.log(time.toUTCString() + ' Init config from exist Record.')
}



initWorkspace();
initMQ();