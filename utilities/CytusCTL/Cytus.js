#!/usr/bin/env node
const yargs = require('yargs')
const args = yargs.argv

let podname = args.podname || args.p || 'guest'


