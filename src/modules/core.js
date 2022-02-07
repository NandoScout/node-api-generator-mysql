'use strict'

require('dotenv').config()
const utils = require('../utils')
const Database = require("./model/database");
const DynamicApi = require("./api");

/**
 * Start API REST Entry Point generator from MySQL connection and run it on app
 * @param {Object} config Format: {host:string,user:string,password:string,database:string,[serverport:number]}
 * @param {Express.Application} app Already created app with body-parser/json, not running
 */
async function run(config,app) {
    config = {
        host : process.env.DB_HOST || config.host,
        username : process.env.DB_USER || config.username,
        password : (typeof process.env.DB_PASS !== 'undefined') ? process.env.DB_PASS : config.password,
        database : process.env.DB_NAME || config.database,
        serverport: (process.env.NODE_ENV === "production" ? process.env.PORT_PROD : process.env.PORT_DEV) || config.serverport,
        apirootpath: process.env.API_ROOTPATH || config.apirootpath
    };
    const db = await Database.create(config);
    if (db instanceof Database) {
        const models = await db.generateModels()
        if (models) {
            const api = await DynamicApi.create(app,db,config);
            if (api) {
                api.run();
            }
        }
    }
}


/**
 * Prints all database values in console
 * @param {Database} database 
 */
 function logDatabaseData(database) {
    if (database && database instanceof Database) {
        if (nonEmptyObject(database.models)) {
            Object.values(database.tables).forEach( t => {
                t.model.findAll().then((row) => {
                    console.log("Table:",t.name)
                    console.log(row.map(r => r.dataValues))
            })})
        } else {
            console.error("No models generated")
        }
    } else {
        console.error("Bad database parameter passed")
    }
}

module.exports = {
    run,
    logDatabaseData
}