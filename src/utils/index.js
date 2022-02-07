'use strict'

require('dotenv').config()
// const Database = require('../modules/db')

async function randomSleep(t=null) {
    await new Promise(resolve => setTimeout(resolve, t?t:(Math.random()*1000)));
}

function nonEmptyObject(obj) {
    return obj instanceof Object && Object.keys(obj).length > 0;
}

function className(obj) {
    return typeof obj === 'object' && obj instanceof Object ? Object.prototype.toString.call(obj) : typeof obj;
}

const logdebug = (msg) => {if(process.env.LOG_LEVEL == 'development') {console.debug('*',msg)}}
const log = (msg) => console.log(msg)


module.exports = {
    randomSleep,
    logdebug,
    log,
    nonEmptyObject,
    className
}