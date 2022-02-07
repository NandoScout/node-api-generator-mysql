'use strict'

const CONF = require('./config')
const utils = require('../../utils');
const Express = require('express');
const Database = require('../model/database');
const Table = require('../model/table');
const DynamicControllers = require('./controller');

class DynamicRoutes {
    api = null
    database = null
    router = null
    routes = {}
    dynamicControllers = null
    static async create(api) {
        if (api.database instanceof Database && api.dynamicControllers instanceof DynamicControllers) {
            this.api = api;
            let rtr = new DynamicRoutes();
            utils.logdebug(`* Generating Express routes`);
            rtr.database = api.database;
            rtr.router = Express.Router();
            rtr.dynamicControllers = api.dynamicControllers;
            await Promise.all(Object.values(api.database.tables).map(rtr.create,rtr));
            // add root info path
            rtr.router.get('/', (req,res) => {
                let out = rtr.getApiInfo();
                res.status(200).send(out);
                utils.logdebug('Requested Info url: '+req.originalUrl)
            } );

            return rtr;
        } else {
            console.error("Failed creating Express routes");
            return null;
        }
    }
    async create(table) {
        if (table instanceof Table) {
            utils.logdebug(`** Generating Express Route for table ${table.name}`);
            if (!this.database)
                this.database = table.database;
            if (!this.router)
                this.router = Express.Router();
            var _ctrl = this.dynamicControllers.getController(table);
            this.router.get(this.getRoute(table,CONF.METHOD.GET_ALL), _ctrl.getAll );   // GET http://fbroqua.sytes.net/
            this.router.get(this.getRoute(table,CONF.METHOD.GET_ONE), _ctrl.getOne ); // GET http://fbroqua.sytes.net/{table.name}/1
            this.router.post(this.getRoute(table,CONF.METHOD.POST), _ctrl.addOne );      // POST http://fbroqua.sytes.net/{table.name}
            this.router.put(this.getRoute(table,CONF.METHOD.PUT), _ctrl.modifyOne ); // PUT http://fbroqua.sytes.net/{table.name}/1
            this.router.patch(this.getRoute(table,CONF.METHOD.PATCH), _ctrl.modifyOne ); // PATCH http://fbroqua.sytes.net/{table.name}/1
            this.router.delete(this.getRoute(table,CONF.METHOD.DELETE), _ctrl.deleteOne ); // DELETE http://fbroqua.sytes.net/{table.name}/1
            return this;
        } else {
            return null;
        }
    }
    getRoute(table,method) {
        if (!(utils.nonEmptyObject(this.routes) 
            && typeof this.routes[table.name] !== 'undefined'
            && typeof this.routes[table.name][method] !== 'undefined')) {
            let _t = Database.constants.TABLE_TYPE;
            let _baseRoute = [];
            switch (table.type) {
                case _t.extension:
                    let _prefix = table.getExtendedTable();
                    _baseRoute.push(_prefix.name);
                    let _suffix = table.name.substring(_prefix.name.length)
                    _baseRoute.push(_suffix)
                    break;
                case _t.relation:
                    let relTable = table.getRelatedTables();
                    if (relTable) {
                        _baseRoute.push(relTable[0].name)
                        DynamicRoutes._addIdParam(_baseRoute,CONF.METHOD.GET_ONE); // force :id insertion
                        _baseRoute.push(relTable[1].name)
                        break;
                    }
                case _t.model:
                default:
                    _baseRoute.push(table.name)
            }
            DynamicRoutes._addIdParam(_baseRoute,method);
            this._addRoute(table,method,'/'+_baseRoute.join('/'));
            utils.logdebug(`Route for ${method} ${table.name} (`+Object.keys(_t)[table.type]+`) ${this.routes[table.name][method]}`)
        }
        return this.routes[table.name][method];
    }
    static _addIdParam(routeArray,method) {
        switch (method) {
            case CONF.METHOD.GET_ONE:
            case CONF.METHOD.PUT:
            case CONF.METHOD.PATCH:
            case CONF.METHOD.DELETE:
                if (!routeArray.includes(':'+CONF.ID_PARAM))
                    routeArray.push(':'+CONF.ID_PARAM)
                else
                    routeArray.push(':'+CONF.ID_PARAM+'2')
                break;
            case CONF.METHOD.GET_ALL:
            case CONF.METHOD.POST:
            default:
        }
    }
    _addRoute(table,method,route) {
        if (typeof this.routes[table.name] === 'undefined')
            this.routes[table.name] = {}
        this.routes[table.name][method] = route;
        return route;
    }
    getRouter() {
        if (!this.router)
            console.error('Create a Router with DynamicRoutes.create before get it');
        return this.router
    }

    getApiInfo() {
        let out = {};
        try {
            for (let table in this.routes) {
                let _mroute = this.routes[table];
                let _port = process.env.PORT_PROD || process.env.PORT_DEV || CONF.DEFAULT_SERVER_PORT;
                out[table] = {};
                Object.keys(_mroute).forEach((method) => {
                    let route = _mroute[method];
                    out[table][method] = {
                        table: table,
                        method: method,
                        path:  route,
                        trylink: `${CONF.TEST_URL}:${_port}${route}`.replace(/:id[2]?/g,"0",)
                    };
                })
            }
        } catch (error) {
            console.error('Unknown error:',error)
        }
        return out;
    }
}

module.exports = DynamicRoutes