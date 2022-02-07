'use strict'

const pluralize = require('pluralize');
const CONF = require('./config')

class Relation {
    type = CONF.REL_TYPE.none
    table1 = null
    table2 = null
    fk = null
    constructor() {

    }
    /**
     * Creates a Relation object. 
     * If pass a type, won't try to identify it
     * @param {Table} table1 
     * @param {Table} table2 
     * @param {CONF.REL_TYPE} type 
     * @returns 
     */
    static async create(table1, table2, type = null) {
        if (type !== null && !Object.values(CONF.REL_TYPE).includes(type))
            throw "Error: invalid relation type"
        if (!(table1 instanceof Table && table2 instanceof Table))
            throw "Error: invalid table object"
        let rel = new Relation();
        let t1 = table1, t2 = table2;
        // correct table order alphabetically
        if (table1.name.startsWith(pluralize.singular(table2.name)+CONF.SPACE_REPLACE)
            || table1.name.endsWith(table2.name)) {
            t2 = table1;
            t1 = table2;
        }
        // get right type
        if (type === null) {
            type = rel.identifyRelationType(t1,t2)
        }
        rel.setRelationData(t1, t2, type);
        return rel.type !== CONF.REL_TYPE.none ? rel : false;
    }

    /**
     * Identify which kind of relationship exists between
     * table1 and table2
     * @param {Table} table1 
     * @param {Table} table2 
     * @returns {CONF.REL_TYPE} relation type
     */
    identifyRelationType(table1, table2) {
        if (this.type === CONF.REL_TYPE.none) {
            if (table1.hasFK() || table2.hasFK()) {
                let fk1of2 = table1.fk.find((attr) => attr.name == CONF.ATTR_ID + CONF.SPACE_REPLACE + pluralize.singular(table2.name)) // table1 has fk of table2
                let fk2of1 = table2.fk.find((attr) => attr.name == CONF.ATTR_ID + CONF.SPACE_REPLACE + pluralize.singular(table1.name)) // table2 has fk of table1
                if (fk1of2 || fk2of1) {
                    if (table1.type === CONF.TABLE_TYPE.model && table2.type === CONF.TABLE_TYPE.model) {
                        this.type = CONF.REL_TYPE.external;
                    } else if (table2.name.startsWith(pluralize.singular(table1.name)+CONF.SPACE_REPLACE)
                            || table2.name.endsWith(table1.name)) { // starts with table1_ or ends with table1
                        if (fk1of2) {
                            this.type = CONF.REL_TYPE.dependency_1;
                            this.fk = fk1of2;
                        } else {
                            this.type = CONF.REL_TYPE.dependency_n;
                            this.fk = fk2of1;
                        }
                    }
                }
            }
        }
        return this.type;
    }

    /**
     * Set needed data and push relation in both tables of it
     * @param {Table} table1 
     * @param {Table} table2 
     * @param {*} type 
     */
    setRelationData(table1, table2,type) {
        if (type !== CONF.REL_TYPE.none) {
            this.table1 = table1;
            this.table2 = table2;
            this.type = type;
            table1.addRelation(this);
            table2.addRelationIs(this);
        }
    }
    _toString(showTable1=true) {
        let _t1 = showTable1 ? this.table1.name + ' ' : '\t\t';
        switch (this.type) {
            case CONF.REL_TYPE.external: 
                return `${_t1}has 1 external relationship with ${this.table2.name}`
            case CONF.REL_TYPE.dependency_1: 
                return `${_t1}has 1 dependency with ${this.table2.name}`
            case CONF.REL_TYPE.dependency_n:
                return `${_t1}has many dependencies with ${this.table2.name}`;
            default:
                return `${_t1}has no relationship with ${this.table2.name}`;
        }
    }
    toString = () => this._toString(true)
    
    /**
     * Show in console required routes info
     */
    toLog() {
        console.log(this._toString(false));
    }
}

module.exports = Relation
const Database = require('./database')
const Table = require('./table')
const Attribute = require('./attribute')