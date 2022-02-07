'use strict'

const CONF = require('./config')
const utils = require('../../utils');
const Database = require('../model/database');
const Table = require('../model/table');

class DynamicControllers {
    database = null
    controllers = {}

    /**
     * Creates DynamicControllers object, generate controllers from database schema
     * using Sequelize models of each Table
     * @param {Database} database 
     * @returns {DynamicControllers}
     */
    static async create(database) {
        if (database instanceof Database) {
            let ctrl = new DynamicControllers();
            utils.logdebug(`* Start generating Dynamic Controllers`);
            ctrl.database = database;
            await Promise.all(Object.values(database.tables).map(ctrl.create,ctrl));
            utils.logdebug(`* Finish generating Dynamic Controllers`);
            return ctrl;
        } else {
            console.error("Failed generating Dynamic Controllers");
            return null;
        }
        
    }

    /**
     * Async method to create and push controller for one table / model
     * Provides each controller with methods: getAll, getOne, addOne, 
     * modifyOne and deleteOne
     * @param {Table} table 
     * @returns 
     */
    create(table) {
        if (table instanceof Table) {
            utils.logdebug(`** Generating Controller for table ${table.name}`);
            if (!this.database)
                this.database = table.database;
            this.controllers[table.name] = {
                table: table,
                getAll: (req,res) => table.model.findAll({where: DynamicControllers.getRequestCondition(table,CONF.METHOD.GET_ALL,req)})
                    .then(records => res.status(200).send(records))
                    .catch(error => res.status(400).send({error: error})),

                getOne: (req,res) => table.model.findAll({where: DynamicControllers.getRequestCondition(table,CONF.METHOD.GET_ONE,req)})
                    .then(records => res.status(200).send(records))
                    .catch(error => res.status(404).send({error: error})),

                addOne: (req,res) => table.model.create(req.body)
                    .then(records => res.status(201).send({affected: records}))
                    .catch(error => res.status(400).send({affected: 0,error: error})),

                modifyOne: (req,res) => table.model.update(req.body,{where: DynamicControllers.getRequestCondition(table,CONF.METHOD.PUT,req)})
                    .then(records => res.status(200).send({affected: records}))
                    .catch(error => res.status(400).send({affected: 0,error: error})),

                deleteOne: (req,res) => table.model.destroy({where: DynamicControllers.getRequestCondition(table,CONF.METHOD.DELETE,req)})
                    .then(records => res.status(200).send({affected: records}))
                    .catch(error => res.status(400).send({affected: 0,error: error}))
            }
            utils.logdebug(`** OK - Generated Controller for table ${table.name}`);
            return this;
        } else {
            console.error(`Failed generating Controller for table ${table.name}`);
            return null;
        }
    }
    
    /**
     * Static method to get Sequelize where condition for 
     * any request params, method and table
     * @param {Table} table 
     * @param {CONF.METHOD} method 
     * @param {*} req 
     * @returns controller object
     */
    static getRequestCondition(table,method,req) {
        let _t = Database.constants.TABLE_TYPE;
        let cond = {};
        if (!["","0",undefined].includes(req.params.id) || [CONF.METHOD.PUT,CONF.METHOD.PATCH,CONF.METHOD.DELETE].includes(method)) {
            if (table.type != _t.relation) {
                cond[Database.constants.ATTR_ID] = req.params.id;
            } else {
                let relFK = table.getRelatedForeignKeys();
                cond[relFK[0].name] = req.params.id;
            }
        }
        if (!["","0",undefined].includes(req.params.id2) || [CONF.METHOD.PUT,CONF.METHOD.PATCH,CONF.METHOD.DELETE].includes(method)) {
            if (table.type == _t.relation) {
                let relFK = table.getRelatedForeignKeys();
                cond[relFK[1].name] = req.params.id2;
            }
        }
        // safe condition if something went wrong for critical methods
        if (!utils.nonEmptyObject(cond) && [CONF.METHOD.PUT,CONF.METHOD.PATCH,CONF.METHOD.DELETE].includes(method)){
            cond[Database.constants.ATTR_ID] = -1;
        }
        utils.logdebug('Request: ' + table.name + '\t' + JSON.stringify(cond) + '\t|\t' + JSON.stringify(req.params) + '\t' + JSON.stringify(req.body))
        return cond;
    }

    /**
     * Get specific controller for one table
     * @param {Table} table 
     * @returns controller object
     */
    getController(table) {
        return DynamicControllers.getController(table,this);
    }

    /**
     * Static method to get specific controller for one table
     * @param {Table} table 
     * @param {DynamicControllers} controllerObject 
     * @returns controller object
     */
    static getController(table,controllerObject) {
        let tableName = table instanceof Table ? table.name : table;
        if (typeof controllerObject.controllers[tableName] === 'undefined') {
            controllerObject.create(table);
        }
        return controllerObject.controllers[tableName];
    }
}

module.exports = DynamicControllers