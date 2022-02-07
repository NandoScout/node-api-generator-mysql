'use strict'

require('dotenv').config()


module.exports = Object.freeze({
    DEFAULT_SERVER_PORT: 3000,
    DEFAULT_API_ROOTPATH: '/',
    TEST_URL: 'http://fbroqua.sytes.net',
    ID_PARAM: 'id',
    METHOD: {
        GET_ONE: 'GET_ONE',
        GET_ALL: 'GET_ALL',
           POST: 'POST',
            PUT: 'PUT',
          PATCH: 'PATCH',
         DELETE: 'DELETE'
    }

})