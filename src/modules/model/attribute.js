'use strict'

const { Sequelize, Op, Model, DataTypes } = require('sequelize');
const CONF = require('./config')
const utils = require('../../utils')

class Attribute {
    table = null;
    dbattr = {}
    name = '';
    type = null;
    nullable = false;
    default = null;
    
    constructor(){

    }
    static async create(parent,dbattr) {
        let attr = new Attribute();
        attr.table = parent;
        attr.setAttributeDataFromDB(dbattr);
        return attr;
        return false;
    }

    setAttributeDataFromDB(dbattr) {
        this.dbattr = dbattr;
        this.name = dbattr.Field;
        this.type = dbattr.Type;
        this.nullable = (dbattr.Null == "YES")
        this.default = dbattr.Default;
    }
    
    isPrimaryKey() {
        return this.name === CONF.ATTR_ID;
    }
    isForeingKey() {
        return this.name.startsWith(CONF.ATTR_ID + CONF.SPACE_REPLACE);
    }
    isCreatedAt() {
        return this.name === CONF.ATTR_CREATEDAT;
    }

    isModifiedAt() {
        return this.name === CONF.ATTR_MODIFIEDAT;
    }

    getSequelizeDefinition() {
        let _def = {};
        _def['field'] = this.name;
        _def['type'] = this.getSequelizeType()
        if (this.isPrimaryKey()) {
            _def['primaryKey'] = true;
            _def['autoIncrement'] = true;
        }
        _def['allowNull'] = this.nullable;
        let _v = this.getSequelizeValidation(_def['type'])
        if (utils.nonEmptyObject(_v))
            _def['validate'] = _v;
        let _d = this.getSequelizeDefault(_def['type'])
        if (_d !== null)
            _def['defaultValue'] = _d;
        return _def;
    }

    getSequelizeValidation(sqztype) {
        let _v = {}
        if (sqztype instanceof DataTypes.INTEGER)
            _v['isInt'] = true;
        if (!this.nullable)
            _v['notNull'] = true;
        return null;
    }

    getSequelizeDefault(sqztype) {
        if (this.default !== null) {
            if (this.isCreatedAt() || this.default.toLowerCase().startsWith('current_timestamp'))
                return DataTypes.NOW;
            if ([DataTypes.INTEGER,DataTypes.BIGINT].includes(sqztype) || sqztype instanceof DataTypes.BIGINT)
                return parseInt(this.default);
            if (sqztype == DataTypes.BOOLEAN)
                return (this.default == '1')
            return this.default
        }
        return null;
    }
    
    getSequelizeType() {
        return Attribute.getSequelizeTypeFromMySql(this.type);
    }

    static getSequelizeTypeFromMySql(dbtype) {
        let type = dbtype.toLowerCase().split(/[ ()]+/);
        var _t = null;
        switch (type[0]) {
            case 'date':
                return DataTypes.DATEONLY;
            case 'time':
            case 'datetime':
                if(type.length > 1 && !isNaN(type[1]))
                    return DataTypes.DATE(parseInt(type[1]))
                else
                    return DataTypes.DATE;
            case 'tinyint':
                if(type.length > 1 && !isNaN(type[1]) && parseInt(type[1]) == 1)
                    return DataTypes.BOOLEAN;
            case 'int':
            case 'smallint':
            case 'mediumint':
                _t = DataTypes.INTEGER;
                break
            case 'bigint':
                if(type.length > 1 && !isNaN(type[1]))
                    _t = DataTypes.BIGINT(parseInt(type[1]))
                else
                    _t = DataTypes.BIGINT;
                break;
            case 'float':
                if(type.length > 1 && !isNaN(type[1]))
                    if(type.length > 2 && !isNaN(type[2]))
                        _t = DataTypes.FLOAT(parseInt(type[1]),parseInt(type[2]))
                    else
                        _t = DataTypes.FLOAT(parseInt(type[1]))
                else
                    _t = DataTypes.FLOAT;
                break;
            case 'double':
                if(type.length > 1 && !isNaN(type[1]))
                    if(type.length > 2 && !isNaN(type[2]))
                        _t = DataTypes.FLOAT(parseInt(type[1]),parseInt(type[2]))
                    else
                        _t = DataTypes.FLOAT(parseInt(type[1]))
                else
                    _t = DataTypes.FLOAT;
                break;
            case 'decimal':
                if(type.length > 1 && !isNaN(type[1]))
                    if(type.length > 2 && !isNaN(type[2]))
                        return DataTypes.FLOAT(parseInt(type[1]),parseInt(type[2]))
                    else
                        return DataTypes.FLOAT(parseInt(type[1]))
                else
                    return DataTypes.FLOAT;
            case 'varchar':
                if(type.length > 1 && !isNaN(type[1]))
                    if(type.length > 2 && !isNaN(type[2]))
                        return DataTypes.STRING(parseInt(type[1]),parseInt(type[2]))
                    else
                        return DataTypes.STRING(parseInt(type[1]))
                else
                    return DataTypes.STRING;
            case 'text':
                return DataTypes.TEXT;
            case 'blob':
                return DataTypes.BLOB;
            case 'json':
                return DataTypes.JSON;
            case 'jsonb':
                return DataTypes.JSONB;
            default:
                return DataTypes.STRING;
        }
        // check unsigned for int, bigint, double, float
        if (_t && type.includes('unsigned'))
            return _t.UNSIGNED;
        else
            return _t;
    }
}

module.exports = Attribute

const Database = require('./database')
const Relation = require('./relation')
const Table = require('./table')