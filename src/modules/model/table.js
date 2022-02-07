'use strict'

const pluralize = require('pluralize')
const { Sequelize } = require('sequelize');
const CONF = require('./config')
const utils = require('../../utils')

class Table {
    database = null
    nodel = null
    type = CONF.TABLE_TYPE.unknown;
    name = '';
    attrs = {}
    pk = null
    fk = []
    createdAt = null
    modifiedAt = null
    rel = {}
    rel_is = {}

    constructor(){

    }
    static async create(parent,name,dbattrs) {
        let tbl = new Table;
        tbl.database = parent;
        tbl.name = name;
        await Promise.all(dbattrs.map(tbl.buildAttribute,tbl));
        tbl.identifyModelTable(); // set Model type or Unknown
        return tbl;
        return false;
    }
    async buildAttribute(dbattr) {
        let attr = await Attribute.create(this,dbattr);
        if (attr instanceof Attribute) {
            this.attrs[attr.name] = attr;
            if (attr.isPrimaryKey())
                this.pk = attr;
            else if (attr.isCreatedAt())
                this.createdAt = attr;
            else if (attr.isModifiedAt())
                this.modifiedAt = attr;
            else if (attr.isForeingKey())
                this.fk.push(attr);
        }
        return attr;
    }
    
    async buildSequelizeModel() {
        utils.logdebug(`** Start creating Sequelize Model for table ${this.name}`);
        let _def = this.getSequelizeDefinition();
        let _opt = this.getSequelizeOptions();
        try {
            let _mod = this.database.sqz.define(this.name,_def,_opt);
            if (_mod) {
                this.model = _mod;
                utils.logdebug(`** Succesfully created Sequelize Model for table ${this.name}`);
                return _mod;
            } else 
                console.error(`** Failed creating Sequelize Model for table ${this.name}`);
        } catch (error) {
            console.error(`** Failed creating Sequelize Model for table ${this.name}:`,error);
        }
        return null;
    }

    async buildSequelizeAssociations() {
        // let _def = this.getSequelizeDefinition();
        // let _opt = this.getSequelizeOptions();
        // try {
        //     let _mod = this.database.sqz.define(this.name,_def,_opt);
        //     if (_mod instanceof Sequelize.Model) {
        //         this.model = _mod;
        //         return _mod;
        //     }
        // } catch (error) {
        //     console.error(`** Failed creating Sequelize Associations for table ${this.name}`);
        // }
        return null;
    }

    hasPK() {
        return this.pk instanceof Attribute;
    }
    hasFK() {
        return this.fk && this.fk.length > 0;
    }
    hasCreatedAt() {
        return this.createdAt instanceof Attribute;
    }
    hasModifiedAt() {
        return this.modifiedAt instanceof Attribute;
    }
    getExtendedTable() {
        if (this.type === CONF.TABLE_TYPE.extension) {
            let _r = this.rel_is[CONF.REL_TYPE.dependency_1];
            if (_r && _r.length > 0) {
                return _r[0].table1;
            } 
        }
        return null;
    }
    
    getRelatedTables() {
        if (this.type === CONF.TABLE_TYPE.relation) {
            let _r = this.rel_is[CONF.REL_TYPE.dependency_n];
            if (_r && _r.length > 1) {
                if (this.name.endsWith(_r[1].table1.name))
                    return [_r[0].table1, _r[1].table1];
                else
                    return [_r[1].table1, _r[0].table1];
            }
        }
        return null;
    }
    
    getRelatedForeignKeys() {
        if (this.type === CONF.TABLE_TYPE.relation) {
            let _r = this.getRelatedTables();
            if (_r && _r.length > 1 && this.fk && this.fk.length > 1) {
                if (this.fk[0].name.endsWith(pluralize.singular(_r[0].name)))
                    return [this.fk[0], this.fk[1]];
                else
                    return [this.fk[1], this.fk[0]];
            }
        }
        return null;
    }
    
    addRelation(rel) {
        if (!this.rel[rel.type])
            this.rel[rel.type] = [];
        this.rel[rel.type].push(rel);
    }
    
    addRelationIs(rel) {
        if (!this.rel_is[rel.type])
            this.rel_is[rel.type] = [];
        this.rel_is[rel.type].push(rel);
    }

    identifyModelTable() {
        if (this.type === CONF.TABLE_TYPE.unknown) {

            let tblParts = this.name.split(CONF.SPACE_REPLACE);
            if (tblParts.length > 1) {
                let tblPlural = this.name,
                    tblSingular = pluralize.singular(this.name);
                var _tables = this.database._tables;
                // Model: Search if it's singular is the beginning or plural end of any other table name
                if (_tables.find( tbl => new RegExp('(^'+tblSingular+CONF.SPACE_REPLACE+CONF.VALID_TABLENAME_REGEX+'$)|(^'+CONF.VALID_TABLENAME_REGEX+CONF.SPACE_REPLACE+tblPlural+'$)').test(tbl))) {
                    this.type = CONF.TABLE_TYPE.model
                } else {
                    this.type = CONF.TABLE_TYPE.unknown
                } 
            } else if (pluralize.isPlural(this.name)) {
                this.type = CONF.TABLE_TYPE.model;
            } else {
                this.type = CONF.TABLE_TYPE.unknown;
            }
            // group table by type
            if (this.type === CONF.TABLE_TYPE.model) {
                this.database.addTableTyped(this);
            }
        }
    }

    identifyNonModelTables(rel) {
        if (rel.type !== CONF.REL_TYPE.none && this.type !== CONF.TABLE_TYPE.model && this.type === CONF.TABLE_TYPE.unknown) {
            switch (rel.type) {
                case CONF.REL_TYPE.dependency_1:
                    this.type = CONF.TABLE_TYPE.extension;
                    this.database.addTableTyped(this);
                    break;
                case CONF.REL_TYPE.dependency_n:
                        this.type = CONF.TABLE_TYPE.relation;
                        this.database.addTableTyped(this);
                    break;
                default:
                    break;
            }
        }
    }

    getSequelizeDefinition() {
        let _def = {};
        for (let attr in this.attrs) {
            _def[attr] = this.attrs[attr].getSequelizeDefinition();
        }
        return _def;
    }

    getSequelizeOptions() {
        let _def = {};
        _def['tableName'] = this.name;
        _def['freezeTableName'] = true;
        _def['underscored'] = true;
        if (this.hasCreatedAt() || this.hasModifiedAt()) {
            _def['timestamps'] = true;
            _def['createdAt'] = this.hasCreatedAt() ? this.createdAt.name : false;
            _def['updatedAt'] = this.hasModifiedAt() ? this.modifiedAt.name : false;
            _def['deletedAt'] = false;
        } else {
            _def['timestamps'] = false;
        }
        return _def;
    }

    toLog() {
        switch (this.type) {
            case CONF.TABLE_TYPE.relation:
                console.log( `\t✓ Relation ${this.name} discovered.`);
                break;
            case CONF.TABLE_TYPE.extension:
                console.log( `\t✓ Extension ${this.name} discovered.`);
                break;
            case CONF.TABLE_TYPE.model:
            default:
                console.log( `\t✓ Model ${this.name} discovered.`);
                for (let type in this.rel) {
                    this.rel[type].forEach((rel) => rel.toLog())
                }
        } 
    }
}

module.exports = Table
const Database = require('./database')
const Relation = require('./relation')
const Attribute = require('./attribute')