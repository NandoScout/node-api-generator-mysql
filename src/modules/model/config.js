'use strict'

require('dotenv').config()


module.exports = Object.freeze({
    DB_DIALECT: 'mysql',
    VALID_TABLENAME_REGEX: '[a-z_]+',
    SPACE_REPLACE: '_',
    ATTR_ID: process.env.DB_ID_FIELD || 'id',
    ATTR_CREATEDAT: process.env.DB_CREATEDAT_FIELD || 'created_at',
    ATTR_MODIFIEDAT: process.env.DB_MODIFIEDAT_FIELD || 'updated_at',
    TABLE_TYPE: {
            model: 0,
        extension: 1,
         relation: 2,
          unknown: 3
    },
    REL_TYPE: {
        external: 0,
    dependency_1: 1,
    dependency_n: 2,
            none: 3
    }

})