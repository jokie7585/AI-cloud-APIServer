#!/usr/bin/env node
const ph = require('path')
const http = require('http')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { json } = require('express')

const env = {
    SchedulerBaseURL : 'http://localhost:3005/scheduler/'
}
 
yargs(hideBin(process.argv))
  .command('list <sourceType>', 'start the server', (yargs) => {
    yargs
      .positional('sourceType', {
        describe: 'sourceType is node || queue'
      })
  }, (argv) => {
    
    let payload= {};

    if (argv.all) {
        payload = {
            method: 'retrieve',
            payload: {
                sourceType: argv.sourceType.toString().toLocaleLowerCase(),
                all: true
            }
        }
    }
    else {
        payload = {
            method: 'retrieve',
            payload: {
                sourceType: argv.sourceType.toString().toLocaleLowerCase(),
                all: false,
                name: argv.name
            }
        }
    }
    
    const req = http.request(ph.join(env.SchedulerBaseURL, 'dispatchEvent'),{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(payload))
        }
      }, res => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
            } catch (e) {
            console.error(e.message);
            }
        });
      })

      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });
      
      // Write data to request body
      req.write(JSON.stringify(payload));
      req.end();
  })
  .option('all', {
    alias: 'a',
    type: 'boolean',
    description: 'list all'
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'list target nodes or queue'
  })
  .argv


  yargs(hideBin(process.argv))
  .command('push', 'start the server', (yargs) => {
    yargs
      .positional('sourceType', {
        describe: 'sourceType is node || queue'
      })
  }, (argv) => {
      let payload = {}
      if(argv.fakeTask) {
        payload = {
            method:'push',
            payload: {
                job: {
                    userId: 'string',
                    workspace: 'string',
                    branch: 'string',
                    podName: 'fakeTaskBolocking',
                    yamlPath: 'string',
                    userCredit: 4,
                    gpuRequest: 10,
                    CpuRequest: 'string'
                }
            }
        }
      }
      else {

        payload = {
            job: JSON.parse(argv.JobJsonString),
        }

      }

      console.log('in push')

      const req = http.request(ph.join(env.SchedulerBaseURL, 'dispatchEvent'),{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(payload))
        }
      }, res => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
            } catch (e) {
            console.error(e.message);
            }
        });
      })

      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });
      
      // Write data to request body
      req.write(JSON.stringify(payload));
      req.end();
  })
  .option('JobJsonString', {
    alias: 'j',
    type: 'string',
    description: 'list all'
  })
  .option('target', {
    alias: 't',
    type: 'string',
    description: 'list target nodes or queue'
  })
  .option('fakeTask', {
    alias: 'f',
    type: 'boolean',
    description: 'list target nodes or queue'
  })
  .argv


  yargs(hideBin(process.argv))
  .command('remove', 'start the server', (yargs) => {
    
  }, (argv) => {

    if(argv.fakeTask) {
        payload = {
            method:'remove',
            payload: 'fakeTaskBolocking'
        }
    }
    else {
        payload = {
            method:'remove',
            payload: argv.name
        }
    }
    

    const req = http.request(ph.join(env.SchedulerBaseURL, 'dispatchEvent'),{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(payload))
        }
      }, res => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
            } catch (e) {
            console.error(e.message);
            }
        });
      })

      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });
      
      // Write data to request body
      req.write(JSON.stringify(payload));
      req.end();
  })
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'list target nodes or queue'
  })
  .option('fakeTask', {
    alias: 'f',
    type: 'boolean',
    description: 'list target nodes or queue'
  })
  .argv


  yargs(hideBin(process.argv))
  .command('pin', 'start the server', (yargs) => {
    
  }, (argv) => {
    http.get(ph.join(env.SchedulerBaseURL, 'pin'), (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
            } catch (e) {
            console.error(e.message);
            }
        });
    })
  })
  .argv


