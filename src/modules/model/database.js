'use strict'

require('dotenv').config()
const CONF = require('./config')
const utils = require('../../utils')
const pluralize = require('pluralize')
const { Sequelize, Op, Model, DataTypes, QueryTypes } = require('sequelize');

class Database {
    static constants = CONF;
    config = {host:'',username:'',password:'',database:'',port:''}
    sqz = null;
    authorized = false;
    _tables = [];
    _attributes = [];
    tables = {};
    tablesTyped = {};
    
    constructor(config) {
        if (!(config && config.host && config.username && config.password !== undefined && config.database)) {
            console.error("Wrong database config info");
            return false;
        }
        this.config = config;
        this.config.dialect = CONF.DB_DIALECT;
        this.config.logging = process.env.SQZ_LOGGER ? eval(process.env.SQZ_LOGGER) : false;
        this.sqz = new Sequelize(this.config);
    }

    /**
     * Test connection to database from config info
     * @returns {Boolean} success connection or not
     */
    async tryConnect() {
        try {
            await this.sqz.authenticate();
            utils.logdebug('Connection has been established successfully.');
            this.authorized = true;
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            this.authorized =  false;
        }
        return this.authorized;
    }

    /**
     * Create Database object, query database and generate entire schema structure
     * This don't creates models of Sequelize
     * @param {*} config (optional) database config
     * @returns {Database} database object 
     */
    static async create(config) {
        const db = new Database(config);
        if (db !== false) {
            db.toLog()
            this.authorized = await db.tryConnect()
            if (this.authorized) {
                await db.generateSchema();
                db.toLog()
                return db;
            }
        }
        return null;
    }

    /**
     * Verify table name achieve name rules
     * @param {*} table table name or table object from database query
     * @returns 
     */
    static isValidTable(table) {
        const re_validTable = new RegExp('^'+CONF.VALID_TABLENAME_REGEX+'$');
        return table instanceof Object
            ? re_validTable.test(Object.values(table)[0])
            : re_validTable.test(table) ;
    }

    /** Add table to tablesTyped property, by type */
    addTableTyped(table) {
        if (!this.tablesTyped[table.type])
            this.tablesTyped[table.type] = [];
        this.tablesTyped[table.type].push(table)
    }

    /**
     * Async method to get all tables from database
     */
    async getTablesFromDB() {
        let _q = 'SHOW TABLES';
        try {
            let rows = await this.sqz.query(_q, {
                raw: true,
                type: QueryTypes.SELECT
            })
            this._tables = rows
                .map((obj) => Object.values(obj)[0])
                .filter(Database.isValidTable);
            await Promise.all(this._tables.map(this.getAttributes,this));
        } catch (err) {
            console.error("Failed retrieving table names:",err);
        }
    }

    /**
     * Async method to get all fields info of one table
     */
    async getAttributes(tableName) {
        let _q = `SHOW COLUMNS FROM ${tableName}`;
        try {
            let rows = await this.sqz.query(_q,{
                raw: true,
                type: QueryTypes.SELECT
            })
            this._attributes[tableName] = rows;
        } catch (error) {
            console.error(`Failed retrieving table ${tableName} attributes:`,err);
        }
    }

    /**
     * Async method to generate entire Schema (Tables, Attributes, Relationships)
     */
    async generateSchema() {
        await this.getTablesFromDB();
        if (this._tables.length > 0 && utils.nonEmptyObject(this._attributes)) {
            let _b = await this.buildTables();
            if (_b && utils.nonEmptyObject(this.tables)) {
                await this.buildRelations();
            }
        }
    }
    /**
     * Build basic tables and attributss objects and identify tables 
     * of type Model and fill Database.tables property
     */
    async buildTables() {
        if (this._tables.length > 0 && utils.nonEmptyObject(this._attributes)) {
            this.tables = {}
            try {
                await Promise.all(this._tables.map(this.buildTable,this));
                return true
            } catch (err) {
                console.error("Failed building tables:",err);
            }
        }
        return false
    }

    /**
     * Async method to build one Table object (not creates Sequelize models)
     * @param {string} tableName 
     * @returns Table object
     */
    async buildTable(tableName) {
        let tbl = await Table.create(this,tableName,this._attributes[tableName]);
        if (tbl instanceof Table) {
            tbl.identifyModelTable();
            this.tables[tbl.name] = tbl;
            utils.logdebug("* Found table: "+tbl.name)
        }
        return tbl;
    }

    /**
     * Build Relation objects between Table objects
     * @returns {Boolean} result of success task
     */
    async buildRelations() {
        if (utils.nonEmptyObject(this.tables)) {
            this.relations = []
            let _tables = Object.keys(this.tables).sort();
            try {
                for (let i = 0; i < _tables.length - 1; i++) {
                    var table1 = this.tables[_tables[i]];
                    for (let j = i+1; j < _tables.length; j++) {
                        var table2 = this.tables[_tables[j]];
                        let t1 = table1, t2 = table2;
                        if (table1.name.startsWith(pluralize.singular(table2.name))
                            || table1.name.endsWith(table2.name)){
                            t2 = table1;
                            t1 = table2;
                        }
                        let rel = await this.buildRelation(t1,t2);
                        this.relations.push(rel);
                    }
                }
                return true
            } catch (err) {
                console.error("Failed building relations:",err);
            }
        }
        return false

    }

    /**
     * Async methot to build one Relation object between 
     * two tables (if exist). Also sets undefined table types.
     */
    async buildRelation(table1,table2) {
        let rel = null;
        if (table1.hasFK() || table2.hasFK()) {
            rel = await Relation.create(table1,table2)
            if (rel) {
                utils.logdebug("* Found relation: "+rel.toString())
                table2.identifyNonModelTables(rel); // set Table type of non models
            }
        }
        return rel;
    }
    
    /**
     * Generates all Sequelize models from Table and Relation objects
     * @returns list of Sequelize models, or false
     */
    async generateModels() {
        if (utils.nonEmptyObject(this.tables)) {
            utils.logdebug(`* Start to generate Sequelize Models`);
            this.models = []
            // build Sequelize models
            await Promise.all(Object.values(this.tables).map(this.buildModel,this));
            // TODO: build Sequelize relations / associations (not required but useful)
            utils.logdebug(`* Finish to generate Sequelize Models`);
            return this.models;
        }
        return false
    }

    /**
     * Async method to generate one Sequelize model from one table
     * @param {Table} table 
     * @returns 
     */
    async buildModel(table) {
        let mod = null;
        if (table instanceof Table) {
            mod = await table.buildSequelizeModel();
            if (mod) {
                this.models.push(mod);
            }
        }
        return mod;
    }
    
    /**
     * Show in console required routes info
     */
    toLog() {
        if (this._tables.length === 0) {
            console.log(`Trying to find models from mysql...\n`);
        } else {
            this.tablesTyped[CONF.TABLE_TYPE.model].sort().forEach(tbl => {
                tbl.toLog();
            });
            console.log('');
        }
    }
}



module.exports = Database
const Relation = require('./relation')
const Table = require('./table')
const Attribute = require('./attribute')
