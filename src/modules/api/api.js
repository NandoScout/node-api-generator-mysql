'use strict'

const CONF = require('./config')
const utils = require('../../utils');
const Express = require('express');
const Database = require('../model/database');
const DynamicControllers = require('./controller');
const DynamicRoutes = require('./router');
const e = require('express');
const { route } = require('../../../../../Clase10/node-mysql-api-crud/contactosRoutes');


class DynamicApi {
    app = null
    database = {}
    config = {}
    dynamicControllers = null
    dynamicRoutes = null
    
    constructor(app,database,config) {
        if (database instanceof Database && app) {
            this.app = app
            this.database = database;
            this.config = config;
            this.config.serverport = this.getServerPort();
            this.config.apirootpath = this.getApiRootPath();
            return this;
        } else {
            return false;
        }
    }

    getServerPort() {
        if (typeof this.config.serverport === 'undefined') {
            if (process.env.NODE_ENV === "production") {
                return  process.env.PORT_PROD || process.env.PORT_DEV || CONF.DEFAULT_SERVER_PORT;
            } else {
                return  process.env.PORT_DEV || process.env.PORT_PROD || CONF.DEFAULT_SERVER_PORT;
            }
        }
        return this.config.serverport;
    }

    getApiRootPath() {
        if (typeof this.config.apirootpath === 'undefined') {
            return  process.env.API_ROOTPATH || CONF.DEFAULT_API_ROOTPATH;
        }
        return this.config.apirootpath;
    }

    static async create(app,database,config) {
        let api = new DynamicApi(app,database,config);
        if (api !== false) {
            console.log(`Trying to find and assign ExpressJs routes...`);
            api.dynamicControllers = await DynamicControllers.create(api.database);
            if (api.dynamicControllers instanceof DynamicControllers) {
                api.dynamicRoutes = await DynamicRoutes.create(api);
                if (api.dynamicRoutes instanceof DynamicRoutes) {
                    api.toLog()
                    utils.logdebug(`Finish to build API REST.\n`);
                    return api;
                }
            }
        }
        return null;
    }

    run(callbacks={}) {
        utils.logdebug(`* Running in ${process.env.NODE_ENV || 'development'} mode`)
        let _port = this.getServerPort();
        const app = this.app;
        //app.use(bodyParser.urlencoded({extended: false}));
        // set routes
        app.use(this.getApiRootPath(),this.dynamicRoutes.getRouter());
        utils.logdebug(`* Setted up Api Routes.`);
        app.use('*',(req,res) => {
            res.status(404).send({ error: 'Wrong request url' });
            if (req.originalUrl != '/favicon.ico')
                console.log('Requested wrong url: '+req.originalUrl)
        })
        utils.logdebug(`* Setted up wrong url response.`);
        app.use(function(err, req, res, next) {
            // if (typeof callbacks.onError === 'function') 
            //     callbacks.onError(err, req, res);
            // else {
                // res.status(500).send({ error: 'Something failed!' });
                res.locals.error = err;
                const status = err.status || 500;
                res.status(status);
                res.render('error');
            // }
            console.log('Request failed:',err)
        })
        utils.logdebug(`* Setted up error handler.`);
        app.listen(_port, function() {
            console.log(`Express Server is up on port ${_port}`);
        })
    }
    
    toLog() {
        var prevRoute = '/';
        Object.values(Object.values(this.dynamicRoutes.routes)).sort().forEach(ctrl => {
            var route = ctrl[CONF.METHOD.GET_ALL]; // take any route for comparisson
            if (route.split('/')[1] != prevRoute.split('/')[1]) // make blank when start different
                console.log('\t'+'-'.repeat(35))
            else
                console.log('');
            for (let method in ctrl) {
                route = ctrl[method];
                console.log(`\t✔%s   %s\t(Try on: %s)`,method.split('_')[0].padStart(9,' '),route.padEnd(40),`${CONF.TEST_URL}:${this.getServerPort()}${route}`);
            }
            prevRoute = route;
        });
        console.log('\t'+'-'.repeat(35))
        console.log(`View all entries in: ${CONF.TEST_URL}:${this.getServerPort()}${this.getApiRootPath()}`);
        console.log('');
    }
}

module.exports = DynamicApi;
