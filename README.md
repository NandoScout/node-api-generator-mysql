# GENERADOR DE API REST EN NODEJS PARA MYSQL
Generador automático de entry points (GET,POST,PUT,DELETE,PATCH) de API REST a partir de una base de datos MySQL existente que debe respetar determinada nomenclatura de tablas y atributos. Se encuentra disponible en [npmjs.com](https://www.npmjs.com/package/api-rest-entrypoint-generator-from-mysql) (api-rest-entrypoint-generator-from-mysql).
_Este desarrollo fue motivado por un desafío planteado a mi persona._

1. [Instalación](#instalacion)
2. [Funcionamiento](#funcionamiento)
3. [Funciones](#funciones)
4. [Nomenclatura MySQL](#nomenclatura-mysql)
   - [¿Por qué Sequelize?](#por-qué-sequelize)
   - [¿Qué queda por hacer?](#qué-queda-por-hacer)
5. [Uso](#uso)
6. [Configuracion mediante archivo .env](#configuracion-mediante-archivo-env)
7. [Salida esperada](#salida-esperada)
8. [Listado de Entry Points - Ejemplo](#listado-de-entry-points)

## INSTALACION
El módulo se puede instalar vía npm de la siguiente forma:
```console
npm i api-rest-entrypoint-generator-from-mysql
```
Estas son las dependencias:
* [dotenv](https://www.npmjs.com/package/dotenv)
* [express](https://www.npmjs.com/package/express)
* [body-parser](https://www.npmjs.com/package/body-parser)
* [sequelize](https://www.npmjs.com/package/sequelize)
* [mysql2](https://www.npmjs.com/package/mysql2)
* [pluralize](https://www.npmjs.com/package/pluralize)

## FUNCIONAMIENTO
A partir de una configuración de conexión a la base de datos MySQL (y tomando algunos valores configurables a través de un archivo .env) y una app de Express JS, la única función run() recrea la estructura de la misma teniendo en cuenta relaciones (ver [NOMENCLATURA](#nomenclatura-sql)), campos clave, campos timestamp de creación y modificación para definirla en Sequelize. 
Luego emplea la misma estructura para generar las rutas y los controladores para cada una, y asocia las mismas al objeto de Express pasado por parámetro sobre una ruta raíz o root configurable, define respuesta para solicitudes inválidas y errores, e inicia el servidor en un puerto configurable.

## FUNCIONES
- generación automática de una API REST con una sola línea
- paralelización de todas las tareas posibles para reducir el tiempo de arranque
- entry points para absolutamente todas las tablas válidas a diferencia de otro framework similar (ver [NOMENCLATURA](#nomenclatura-mysql))
- entry point para generar un listado de los entry points al consultar la raíz de la API (ver [LISTADO EJEMPLO](#listado-de-entry-points))
- carga de id autoincremental, fecha de creación y de modificación (estos últimos son configurables con un mismo nombre para toda la base de datos y pueden o no estar en las distintas tablas)
- permite nombre de tablas modelo de varias palabras (ej. medical_conditions) a diferencia de otro framework similar
- se pueden hacer búsquedas solo por un id en las tablas de relaciones, indicando **cero (0)** en el id referente a la otra tabla de la relación (ej. /organizations/0/products/0); esto permite también listar todos los elementos de las tablas de relaciones
- se buscó la forma correcta de definir dinámicamente la base de datos en Sequelize 
### ¿Por qué Sequelize?
Era necesario realizar algo diferente a lo que ya existe disponible (ej. [Kaleboo Framework](https://github.com/gonzaloaizpun/KalebooFramework/blob/master/readme.md) - mejor o peor, pero este fue creado por completo por mí). Con Sequelize se logra una más rápida y sencilla adopción de nuevas funcionalidades así como una drástica reducción del código de los controladores y validación de datos.
También permite realizar en forma más sencila la migración a otros motores de bases de datos SQL.
### ¿Qué queda por hacer?
- Sería bueno mejorar el sistema de logger, aunque no necesario
- Agregar callbacks / hooks en la configuración para acceder a momentos y datos importantes permitiendo mayor versatilidad del módulo
- Aún no genera las asociaciones de Sequelize que permite extender la funcionalidad de los objetos del modelo (quedó relegado por falta de tiempo)
- Probar aún más, siempre es bueno

## NOMENCLATURA MySQL
* Todos los nombres de las tablas están en minúscula. (ej. users).
* Todos los nombres de las tablas están en inglés. (ej. devices).
* Todos los nombres de las tablas, de haber espacio, el mismo está reemplazado por guión bajo. (ej. device_brands).
* Todos los nombres de las tablas que son modelos, están en plural (ej. devices).
* Todos los nombres de las tablas que son relaciones, tienen como prefijo el nombre del modelo en singular. (ej. device_brands donde device es el modelo).
* Tipos de relaciones: 
    - A - Entre modelos, a través de una tabla intermedia cuyo nombre se define con singular(modelo1)\_modelo2
    (ej. organization_users donde un modelo es organizations y otro es users, dado que existen esas 2 tablas en plural, por lo cual son modelos), y 

    - B - Extensiones a un mismo modelo, cuyo nombre se define con singular(modelo1)\_plural(extension)
    (ej. device_brands donde un modelo es devices y tiene atributos (1 o más) extensibles/relación con device_brands)

* Todas las tablas tienen una PRIMARY KEY llamada id **numérico y distinto de cero (0)**.
* Todas las tablas que tienen una relación con otro modelo o bien extensiones de un mismo modelo, tienen una FOREIGN KEY que comienza con el prefijo id_ y luego el nombre del modelo en singular (ej. id_user).

## USO
```js
var ApiGenerator = require('rest-entrypoint-generator-from-mysql');
var express = require('express');
var bodyParser = require('body-parser');

// Express App
var app = express();
    app.use(bodyParser.json());

// MySQL Config - will be priorized setted .env variables (indicated at each inline comment)
const config = {
        host : 'localhost', // sobreescrito por env.DB_HOST
	  username : 'root',      // sobreescrito por env.DB_USER
    password : 'password',  // sobreescrito por DB_PASS
    database : 'testing',   // sobreescrito por DB_NAME
  serverport : 2000,        // Opcional, sobreescrito por PORT_DEV / PORT_PROD
 apirootpath : '/'          // Opcional, sobreescrito por env.API_ROOTPATH
};

ApiGenerator.run(config, app);
```
## CONFIGURACION MEDIANTE ARCHIVO .env
Tiene opción a definir configuraciones en un archivo llamado .env en la raíz de su proyecto. Cada una de estas configuraciones reemplaza la configuración que pueda haber pasado por parámetro a la función run().
A continuación, un ejemplo:

```console
API_ROOTPATH=/
PORT_DEV=2000
PORT_PROD=2000
NODE_ENV=production
# NODE_ENV=development
# LOG_LEVEL=development
SQZ_LOGGER=
# SQZ_LOGGER=console.log 

DB_USER=root
DB_PASS=password
DB_NAME=testing
DB_HOST=localhost

DB_ID_FIELD =id
DB_CREATEDAT_FIELD=created_at
DB_MODIFIEDAT_FIELD=updated_at
```

## SALIDA ESPERADA
Cuando el parámetro LOG_LEVEL es development, la salida se incrementa mucho, en forma desordenada (por la ejecución asíncrona de tareas) a diferencia de la salida de producción que se emite cuando la ejecución es estable.
```console
Trying to find models from mysql...

        ✓ Model attributes discovered.
                has many dependencies with organization_attributes
                has many dependencies with user_attributes
        ✓ Model devices discovered.
                has 1 dependency with device_brands
                has 1 dependency with device_screensizes
        ✓ Model measurements discovered.
                has 1 external relationship with metrics
                has 1 external relationship with units
        ✓ Model metrics discovered.
        ✓ Model organizations discovered.
                has many dependencies with organization_attributes
                has many dependencies with organization_products
                has many dependencies with organization_users
        ✓ Model permissions discovered.
                has many dependencies with user_permissions
        ✓ Model products discovered.
                has many dependencies with organization_products
        ✓ Model units discovered.
        ✓ Model users discovered.
                has many dependencies with organization_users
                has many dependencies with user_attributes
                has many dependencies with user_permissions

Trying to find and assign ExpressJs routes...
        -----------------------------------
        ✔      GET   /attributes                                (Try on: http://fbroqua.sytes.net:2000/attributes)
        ✔      GET   /attributes/:id                            (Try on: http://fbroqua.sytes.net:2000/attributes/:id)
        ✔     POST   /attributes                                (Try on: http://fbroqua.sytes.net:2000/attributes)
        ✔      PUT   /attributes/:id                            (Try on: http://fbroqua.sytes.net:2000/attributes/:id)
        ✔    PATCH   /attributes/:id                            (Try on: http://fbroqua.sytes.net:2000/attributes/:id)
        ✔   DELETE   /attributes/:id                            (Try on: http://fbroqua.sytes.net:2000/attributes/:id)
        -----------------------------------
        ✔      GET   /devices/brands                            (Try on: http://fbroqua.sytes.net:2000/devices/brands)
        ✔      GET   /devices/brands/:id                        (Try on: http://fbroqua.sytes.net:2000/devices/brands/:id)
        ✔     POST   /devices/brands                            (Try on: http://fbroqua.sytes.net:2000/devices/brands)
        ✔      PUT   /devices/brands/:id                        (Try on: http://fbroqua.sytes.net:2000/devices/brands/:id)
        ✔    PATCH   /devices/brands/:id                        (Try on: http://fbroqua.sytes.net:2000/devices/brands/:id)
        ✔   DELETE   /devices/brands/:id                        (Try on: http://fbroqua.sytes.net:2000/devices/brands/:id)

        ✔      GET   /devices/screensizes                       (Try on: http://fbroqua.sytes.net:2000/devices/screensizes)
        ✔      GET   /devices/screensizes/:id                   (Try on: http://fbroqua.sytes.net:2000/devices/screensizes/:id)
        ✔     POST   /devices/screensizes                       (Try on: http://fbroqua.sytes.net:2000/devices/screensizes)
        ✔      PUT   /devices/screensizes/:id                   (Try on: http://fbroqua.sytes.net:2000/devices/screensizes/:id)
        ✔    PATCH   /devices/screensizes/:id                   (Try on: http://fbroqua.sytes.net:2000/devices/screensizes/:id)
        ✔   DELETE   /devices/screensizes/:id                   (Try on: http://fbroqua.sytes.net:2000/devices/screensizes/:id)

        ✔      GET   /devices                                   (Try on: http://fbroqua.sytes.net:2000/devices)
        ✔      GET   /devices/:id                               (Try on: http://fbroqua.sytes.net:2000/devices/:id)
        ✔     POST   /devices                                   (Try on: http://fbroqua.sytes.net:2000/devices)
        ✔      PUT   /devices/:id                               (Try on: http://fbroqua.sytes.net:2000/devices/:id)
        ✔    PATCH   /devices/:id                               (Try on: http://fbroqua.sytes.net:2000/devices/:id)
        ✔   DELETE   /devices/:id                               (Try on: http://fbroqua.sytes.net:2000/devices/:id)
        -----------------------------------
        ✔      GET   /measurements                              (Try on: http://fbroqua.sytes.net:2000/measurements)
        ✔      GET   /measurements/:id                          (Try on: http://fbroqua.sytes.net:2000/measurements/:id)
        ✔     POST   /measurements                              (Try on: http://fbroqua.sytes.net:2000/measurements)
        ✔      PUT   /measurements/:id                          (Try on: http://fbroqua.sytes.net:2000/measurements/:id)
        ✔    PATCH   /measurements/:id                          (Try on: http://fbroqua.sytes.net:2000/measurements/:id)
        ✔   DELETE   /measurements/:id                          (Try on: http://fbroqua.sytes.net:2000/measurements/:id)
        -----------------------------------
        ✔      GET   /metrics                                   (Try on: http://fbroqua.sytes.net:2000/metrics)
        ✔      GET   /metrics/:id                               (Try on: http://fbroqua.sytes.net:2000/metrics/:id)
        ✔     POST   /metrics                                   (Try on: http://fbroqua.sytes.net:2000/metrics)
        ✔      PUT   /metrics/:id                               (Try on: http://fbroqua.sytes.net:2000/metrics/:id)
        ✔    PATCH   /metrics/:id                               (Try on: http://fbroqua.sytes.net:2000/metrics/:id)
        ✔   DELETE   /metrics/:id                               (Try on: http://fbroqua.sytes.net:2000/metrics/:id)
        -----------------------------------
        ✔      GET   /organizations/:id/attributes              (Try on: http://fbroqua.sytes.net:2000/organizations/:id/attributes)
        ✔      GET   /organizations/:id/attributes/:id2         (Try on: http://fbroqua.sytes.net:2000/organizations/:id/attributes/:id2)
        ✔     POST   /organizations/:id/attributes              (Try on: http://fbroqua.sytes.net:2000/organizations/:id/attributes)
        ✔      PUT   /organizations/:id/attributes/:id2         (Try on: http://fbroqua.sytes.net:2000/organizations/:id/attributes/:id2)
        ✔    PATCH   /organizations/:id/attributes/:id2         (Try on: http://fbroqua.sytes.net:2000/organizations/:id/attributes/:id2)
        ✔   DELETE   /organizations/:id/attributes/:id2         (Try on: http://fbroqua.sytes.net:2000/organizations/:id/attributes/:id2)

        ✔      GET   /organizations/:id/products                (Try on: http://fbroqua.sytes.net:2000/organizations/:id/products)
        ✔      GET   /organizations/:id/products/:id2           (Try on: http://fbroqua.sytes.net:2000/organizations/:id/products/:id2)
        ✔     POST   /organizations/:id/products                (Try on: http://fbroqua.sytes.net:2000/organizations/:id/products)
        ✔      PUT   /organizations/:id/products/:id2           (Try on: http://fbroqua.sytes.net:2000/organizations/:id/products/:id2)
        ✔    PATCH   /organizations/:id/products/:id2           (Try on: http://fbroqua.sytes.net:2000/organizations/:id/products/:id2)
        ✔   DELETE   /organizations/:id/products/:id2           (Try on: http://fbroqua.sytes.net:2000/organizations/:id/products/:id2)

        ✔      GET   /organizations/:id/users                   (Try on: http://fbroqua.sytes.net:2000/organizations/:id/users)
        ✔      GET   /organizations/:id/users/:id2              (Try on: http://fbroqua.sytes.net:2000/organizations/:id/users/:id2)
        ✔     POST   /organizations/:id/users                   (Try on: http://fbroqua.sytes.net:2000/organizations/:id/users)
        ✔      PUT   /organizations/:id/users/:id2              (Try on: http://fbroqua.sytes.net:2000/organizations/:id/users/:id2)
        ✔    PATCH   /organizations/:id/users/:id2              (Try on: http://fbroqua.sytes.net:2000/organizations/:id/users/:id2)
        ✔   DELETE   /organizations/:id/users/:id2              (Try on: http://fbroqua.sytes.net:2000/organizations/:id/users/:id2)

        ✔      GET   /organizations                             (Try on: http://fbroqua.sytes.net:2000/organizations)
        ✔      GET   /organizations/:id                         (Try on: http://fbroqua.sytes.net:2000/organizations/:id)
        ✔     POST   /organizations                             (Try on: http://fbroqua.sytes.net:2000/organizations)
        ✔      PUT   /organizations/:id                         (Try on: http://fbroqua.sytes.net:2000/organizations/:id)
        ✔    PATCH   /organizations/:id                         (Try on: http://fbroqua.sytes.net:2000/organizations/:id)
        ✔   DELETE   /organizations/:id                         (Try on: http://fbroqua.sytes.net:2000/organizations/:id)
        -----------------------------------
        ✔      GET   /permissions                               (Try on: http://fbroqua.sytes.net:2000/permissions)
        ✔      GET   /permissions/:id                           (Try on: http://fbroqua.sytes.net:2000/permissions/:id)
        ✔     POST   /permissions                               (Try on: http://fbroqua.sytes.net:2000/permissions)
        ✔      PUT   /permissions/:id                           (Try on: http://fbroqua.sytes.net:2000/permissions/:id)
        ✔    PATCH   /permissions/:id                           (Try on: http://fbroqua.sytes.net:2000/permissions/:id)
        ✔   DELETE   /permissions/:id                           (Try on: http://fbroqua.sytes.net:2000/permissions/:id)
        -----------------------------------
        ✔      GET   /products                                  (Try on: http://fbroqua.sytes.net:2000/products)
        ✔      GET   /products/:id                              (Try on: http://fbroqua.sytes.net:2000/products/:id)
        ✔     POST   /products                                  (Try on: http://fbroqua.sytes.net:2000/products)
        ✔      PUT   /products/:id                              (Try on: http://fbroqua.sytes.net:2000/products/:id)
        ✔    PATCH   /products/:id                              (Try on: http://fbroqua.sytes.net:2000/products/:id)
        ✔   DELETE   /products/:id                              (Try on: http://fbroqua.sytes.net:2000/products/:id)
        -----------------------------------
        ✔      GET   /units                                     (Try on: http://fbroqua.sytes.net:2000/units)
        ✔      GET   /units/:id                                 (Try on: http://fbroqua.sytes.net:2000/units/:id)
        ✔     POST   /units                                     (Try on: http://fbroqua.sytes.net:2000/units)
        ✔      PUT   /units/:id                                 (Try on: http://fbroqua.sytes.net:2000/units/:id)
        ✔    PATCH   /units/:id                                 (Try on: http://fbroqua.sytes.net:2000/units/:id)
        ✔   DELETE   /units/:id                                 (Try on: http://fbroqua.sytes.net:2000/units/:id)
        -----------------------------------
        ✔      GET   /users/:id/attributes                      (Try on: http://fbroqua.sytes.net:2000/users/:id/attributes)
        ✔      GET   /users/:id/attributes/:id2                 (Try on: http://fbroqua.sytes.net:2000/users/:id/attributes/:id2)
        ✔     POST   /users/:id/attributes                      (Try on: http://fbroqua.sytes.net:2000/users/:id/attributes)
        ✔      PUT   /users/:id/attributes/:id2                 (Try on: http://fbroqua.sytes.net:2000/users/:id/attributes/:id2)
        ✔    PATCH   /users/:id/attributes/:id2                 (Try on: http://fbroqua.sytes.net:2000/users/:id/attributes/:id2)
        ✔   DELETE   /users/:id/attributes/:id2                 (Try on: http://fbroqua.sytes.net:2000/users/:id/attributes/:id2)

        ✔      GET   /users/:id/permissions                     (Try on: http://fbroqua.sytes.net:2000/users/:id/permissions)
        ✔      GET   /users/:id/permissions/:id2                (Try on: http://fbroqua.sytes.net:2000/users/:id/permissions/:id2)
        ✔     POST   /users/:id/permissions                     (Try on: http://fbroqua.sytes.net:2000/users/:id/permissions)
        ✔      PUT   /users/:id/permissions/:id2                (Try on: http://fbroqua.sytes.net:2000/users/:id/permissions/:id2)
        ✔    PATCH   /users/:id/permissions/:id2                (Try on: http://fbroqua.sytes.net:2000/users/:id/permissions/:id2)
        ✔   DELETE   /users/:id/permissions/:id2                (Try on: http://fbroqua.sytes.net:2000/users/:id/permissions/:id2)

        ✔      GET   /users                                     (Try on: http://fbroqua.sytes.net:2000/users)
        ✔      GET   /users/:id                                 (Try on: http://fbroqua.sytes.net:2000/users/:id)
        ✔     POST   /users                                     (Try on: http://fbroqua.sytes.net:2000/users)
        ✔      PUT   /users/:id                                 (Try on: http://fbroqua.sytes.net:2000/users/:id)
        ✔    PATCH   /users/:id                                 (Try on: http://fbroqua.sytes.net:2000/users/:id)
        ✔   DELETE   /users/:id                                 (Try on: http://fbroqua.sytes.net:2000/users/:id)
        -----------------------------------
View all entries in: http://fbroqua.sytes.net:2000/

Express Server is up on port 2000
```

## LISTADO DE ENTRY POINTS
Al consultar la raíz de la API (ej. http://fbroqua.sytes.net:2000/) recibirá una salida similara a la siguiente. donde los "0" pueden ser reemplazados por los id deseados:
```json
{
    "attributes": {
        "GET_ALL": {
            "table": "attributes",
            "method": "GET_ALL",
            "path": "/attributes",
            "trylink": "http://fbroqua.sytes.net:2000/attributes"
        },
        "GET_ONE": {
            "table": "attributes",
            "method": "GET_ONE",
            "path": "/attributes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/attributes/0"
        },
        "POST": {
            "table": "attributes",
            "method": "POST",
            "path": "/attributes",
            "trylink": "http://fbroqua.sytes.net:2000/attributes"
        },
        "PUT": {
            "table": "attributes",
            "method": "PUT",
            "path": "/attributes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/attributes/0"
        },
        "PATCH": {
            "table": "attributes",
            "method": "PATCH",
            "path": "/attributes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/attributes/0"
        },
        "DELETE": {
            "table": "attributes",
            "method": "DELETE",
            "path": "/attributes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/attributes/0"
        }
    },
    "device_brands": {
        "GET_ALL": {
            "table": "device_brands",
            "method": "GET_ALL",
            "path": "/devices/brands",
            "trylink": "http://fbroqua.sytes.net:2000/devices/brands"
        },
        "GET_ONE": {
            "table": "device_brands",
            "method": "GET_ONE",
            "path": "/devices/brands/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/brands/0"
        },
        "POST": {
            "table": "device_brands",
            "method": "POST",
            "path": "/devices/brands",
            "trylink": "http://fbroqua.sytes.net:2000/devices/brands"
        },
        "PUT": {
            "table": "device_brands",
            "method": "PUT",
            "path": "/devices/brands/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/brands/0"
        },
        "PATCH": {
            "table": "device_brands",
            "method": "PATCH",
            "path": "/devices/brands/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/brands/0"
        },
        "DELETE": {
            "table": "device_brands",
            "method": "DELETE",
            "path": "/devices/brands/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/brands/0"
        }
    },
    "device_screensizes": {
        "GET_ALL": {
            "table": "device_screensizes",
            "method": "GET_ALL",
            "path": "/devices/screensizes",
            "trylink": "http://fbroqua.sytes.net:2000/devices/screensizes"
        },
        "GET_ONE": {
            "table": "device_screensizes",
            "method": "GET_ONE",
            "path": "/devices/screensizes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/screensizes/0"
        },
        "POST": {
            "table": "device_screensizes",
            "method": "POST",
            "path": "/devices/screensizes",
            "trylink": "http://fbroqua.sytes.net:2000/devices/screensizes"
        },
        "PUT": {
            "table": "device_screensizes",
            "method": "PUT",
            "path": "/devices/screensizes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/screensizes/0"
        },
        "PATCH": {
            "table": "device_screensizes",
            "method": "PATCH",
            "path": "/devices/screensizes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/screensizes/0"
        },
        "DELETE": {
            "table": "device_screensizes",
            "method": "DELETE",
            "path": "/devices/screensizes/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/screensizes/0"
        }
    },
    "devices": {
        "GET_ALL": {
            "table": "devices",
            "method": "GET_ALL",
            "path": "/devices",
            "trylink": "http://fbroqua.sytes.net:2000/devices"
        },
        "GET_ONE": {
            "table": "devices",
            "method": "GET_ONE",
            "path": "/devices/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/0"
        },
        "POST": {
            "table": "devices",
            "method": "POST",
            "path": "/devices",
            "trylink": "http://fbroqua.sytes.net:2000/devices"
        },
        "PUT": {
            "table": "devices",
            "method": "PUT",
            "path": "/devices/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/0"
        },
        "PATCH": {
            "table": "devices",
            "method": "PATCH",
            "path": "/devices/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/0"
        },
        "DELETE": {
            "table": "devices",
            "method": "DELETE",
            "path": "/devices/:id",
            "trylink": "http://fbroqua.sytes.net:2000/devices/0"
        }
    },
    "measurements": {
        "GET_ALL": {
            "table": "measurements",
            "method": "GET_ALL",
            "path": "/measurements",
            "trylink": "http://fbroqua.sytes.net:2000/measurements"
        },
        "GET_ONE": {
            "table": "measurements",
            "method": "GET_ONE",
            "path": "/measurements/:id",
            "trylink": "http://fbroqua.sytes.net:2000/measurements/0"
        },
        "POST": {
            "table": "measurements",
            "method": "POST",
            "path": "/measurements",
            "trylink": "http://fbroqua.sytes.net:2000/measurements"
        },
        "PUT": {
            "table": "measurements",
            "method": "PUT",
            "path": "/measurements/:id",
            "trylink": "http://fbroqua.sytes.net:2000/measurements/0"
        },
        "PATCH": {
            "table": "measurements",
            "method": "PATCH",
            "path": "/measurements/:id",
            "trylink": "http://fbroqua.sytes.net:2000/measurements/0"
        },
        "DELETE": {
            "table": "measurements",
            "method": "DELETE",
            "path": "/measurements/:id",
            "trylink": "http://fbroqua.sytes.net:2000/measurements/0"
        }
    },
    "metrics": {
        "GET_ALL": {
            "table": "metrics",
            "method": "GET_ALL",
            "path": "/metrics",
            "trylink": "http://fbroqua.sytes.net:2000/metrics"
        },
        "GET_ONE": {
            "table": "metrics",
            "method": "GET_ONE",
            "path": "/metrics/:id",
            "trylink": "http://fbroqua.sytes.net:2000/metrics/0"
        },
        "POST": {
            "table": "metrics",
            "method": "POST",
            "path": "/metrics",
            "trylink": "http://fbroqua.sytes.net:2000/metrics"
        },
        "PUT": {
            "table": "metrics",
            "method": "PUT",
            "path": "/metrics/:id",
            "trylink": "http://fbroqua.sytes.net:2000/metrics/0"
        },
        "PATCH": {
            "table": "metrics",
            "method": "PATCH",
            "path": "/metrics/:id",
            "trylink": "http://fbroqua.sytes.net:2000/metrics/0"
        },
        "DELETE": {
            "table": "metrics",
            "method": "DELETE",
            "path": "/metrics/:id",
            "trylink": "http://fbroqua.sytes.net:2000/metrics/0"
        }
    },
    "organization_attributes": {
        "GET_ALL": {
            "table": "organization_attributes",
            "method": "GET_ALL",
            "path": "/organizations/:id/attributes",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/attributes"
        },
        "GET_ONE": {
            "table": "organization_attributes",
            "method": "GET_ONE",
            "path": "/organizations/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/attributes/0"
        },
        "POST": {
            "table": "organization_attributes",
            "method": "POST",
            "path": "/organizations/:id/attributes",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/attributes"
        },
        "PUT": {
            "table": "organization_attributes",
            "method": "PUT",
            "path": "/organizations/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/attributes/0"
        },
        "PATCH": {
            "table": "organization_attributes",
            "method": "PATCH",
            "path": "/organizations/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/attributes/0"
        },
        "DELETE": {
            "table": "organization_attributes",
            "method": "DELETE",
            "path": "/organizations/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/attributes/0"
        }
    },
    "organization_products": {
        "GET_ALL": {
            "table": "organization_products",
            "method": "GET_ALL",
            "path": "/organizations/:id/products",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/products"
        },
        "GET_ONE": {
            "table": "organization_products",
            "method": "GET_ONE",
            "path": "/organizations/:id/products/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/products/0"
        },
        "POST": {
            "table": "organization_products",
            "method": "POST",
            "path": "/organizations/:id/products",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/products"
        },
        "PUT": {
            "table": "organization_products",
            "method": "PUT",
            "path": "/organizations/:id/products/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/products/0"
        },
        "PATCH": {
            "table": "organization_products",
            "method": "PATCH",
            "path": "/organizations/:id/products/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/products/0"
        },
        "DELETE": {
            "table": "organization_products",
            "method": "DELETE",
            "path": "/organizations/:id/products/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/products/0"
        }
    },
    "organization_users": {
        "GET_ALL": {
            "table": "organization_users",
            "method": "GET_ALL",
            "path": "/organizations/:id/users",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/users"
        },
        "GET_ONE": {
            "table": "organization_users",
            "method": "GET_ONE",
            "path": "/organizations/:id/users/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/users/0"
        },
        "POST": {
            "table": "organization_users",
            "method": "POST",
            "path": "/organizations/:id/users",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/users"
        },
        "PUT": {
            "table": "organization_users",
            "method": "PUT",
            "path": "/organizations/:id/users/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/users/0"
        },
        "PATCH": {
            "table": "organization_users",
            "method": "PATCH",
            "path": "/organizations/:id/users/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/users/0"
        },
        "DELETE": {
            "table": "organization_users",
            "method": "DELETE",
            "path": "/organizations/:id/users/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0/users/0"
        }
    },
    "organizations": {
        "GET_ALL": {
            "table": "organizations",
            "method": "GET_ALL",
            "path": "/organizations",
            "trylink": "http://fbroqua.sytes.net:2000/organizations"
        },
        "GET_ONE": {
            "table": "organizations",
            "method": "GET_ONE",
            "path": "/organizations/:id",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0"
        },
        "POST": {
            "table": "organizations",
            "method": "POST",
            "path": "/organizations",
            "trylink": "http://fbroqua.sytes.net:2000/organizations"
        },
        "PUT": {
            "table": "organizations",
            "method": "PUT",
            "path": "/organizations/:id",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0"
        },
        "PATCH": {
            "table": "organizations",
            "method": "PATCH",
            "path": "/organizations/:id",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0"
        },
        "DELETE": {
            "table": "organizations",
            "method": "DELETE",
            "path": "/organizations/:id",
            "trylink": "http://fbroqua.sytes.net:2000/organizations/0"
        }
    },
    "permissions": {
        "GET_ALL": {
            "table": "permissions",
            "method": "GET_ALL",
            "path": "/permissions",
            "trylink": "http://fbroqua.sytes.net:2000/permissions"
        },
        "GET_ONE": {
            "table": "permissions",
            "method": "GET_ONE",
            "path": "/permissions/:id",
            "trylink": "http://fbroqua.sytes.net:2000/permissions/0"
        },
        "POST": {
            "table": "permissions",
            "method": "POST",
            "path": "/permissions",
            "trylink": "http://fbroqua.sytes.net:2000/permissions"
        },
        "PUT": {
            "table": "permissions",
            "method": "PUT",
            "path": "/permissions/:id",
            "trylink": "http://fbroqua.sytes.net:2000/permissions/0"
        },
        "PATCH": {
            "table": "permissions",
            "method": "PATCH",
            "path": "/permissions/:id",
            "trylink": "http://fbroqua.sytes.net:2000/permissions/0"
        },
        "DELETE": {
            "table": "permissions",
            "method": "DELETE",
            "path": "/permissions/:id",
            "trylink": "http://fbroqua.sytes.net:2000/permissions/0"
        }
    },
    "products": {
        "GET_ALL": {
            "table": "products",
            "method": "GET_ALL",
            "path": "/products",
            "trylink": "http://fbroqua.sytes.net:2000/products"
        },
        "GET_ONE": {
            "table": "products",
            "method": "GET_ONE",
            "path": "/products/:id",
            "trylink": "http://fbroqua.sytes.net:2000/products/0"
        },
        "POST": {
            "table": "products",
            "method": "POST",
            "path": "/products",
            "trylink": "http://fbroqua.sytes.net:2000/products"
        },
        "PUT": {
            "table": "products",
            "method": "PUT",
            "path": "/products/:id",
            "trylink": "http://fbroqua.sytes.net:2000/products/0"
        },
        "PATCH": {
            "table": "products",
            "method": "PATCH",
            "path": "/products/:id",
            "trylink": "http://fbroqua.sytes.net:2000/products/0"
        },
        "DELETE": {
            "table": "products",
            "method": "DELETE",
            "path": "/products/:id",
            "trylink": "http://fbroqua.sytes.net:2000/products/0"
        }
    },
    "units": {
        "GET_ALL": {
            "table": "units",
            "method": "GET_ALL",
            "path": "/units",
            "trylink": "http://fbroqua.sytes.net:2000/units"
        },
        "GET_ONE": {
            "table": "units",
            "method": "GET_ONE",
            "path": "/units/:id",
            "trylink": "http://fbroqua.sytes.net:2000/units/0"
        },
        "POST": {
            "table": "units",
            "method": "POST",
            "path": "/units",
            "trylink": "http://fbroqua.sytes.net:2000/units"
        },
        "PUT": {
            "table": "units",
            "method": "PUT",
            "path": "/units/:id",
            "trylink": "http://fbroqua.sytes.net:2000/units/0"
        },
        "PATCH": {
            "table": "units",
            "method": "PATCH",
            "path": "/units/:id",
            "trylink": "http://fbroqua.sytes.net:2000/units/0"
        },
        "DELETE": {
            "table": "units",
            "method": "DELETE",
            "path": "/units/:id",
            "trylink": "http://fbroqua.sytes.net:2000/units/0"
        }
    },
    "user_attributes": {
        "GET_ALL": {
            "table": "user_attributes",
            "method": "GET_ALL",
            "path": "/users/:id/attributes",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/attributes"
        },
        "GET_ONE": {
            "table": "user_attributes",
            "method": "GET_ONE",
            "path": "/users/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/attributes/0"
        },
        "POST": {
            "table": "user_attributes",
            "method": "POST",
            "path": "/users/:id/attributes",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/attributes"
        },
        "PUT": {
            "table": "user_attributes",
            "method": "PUT",
            "path": "/users/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/attributes/0"
        },
        "PATCH": {
            "table": "user_attributes",
            "method": "PATCH",
            "path": "/users/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/attributes/0"
        },
        "DELETE": {
            "table": "user_attributes",
            "method": "DELETE",
            "path": "/users/:id/attributes/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/attributes/0"
        }
    },
    "user_permissions": {
        "GET_ALL": {
            "table": "user_permissions",
            "method": "GET_ALL",
            "path": "/users/:id/permissions",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/permissions"
        },
        "GET_ONE": {
            "table": "user_permissions",
            "method": "GET_ONE",
            "path": "/users/:id/permissions/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/permissions/0"
        },
        "POST": {
            "table": "user_permissions",
            "method": "POST",
            "path": "/users/:id/permissions",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/permissions"
        },
        "PUT": {
            "table": "user_permissions",
            "method": "PUT",
            "path": "/users/:id/permissions/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/permissions/0"
        },
        "PATCH": {
            "table": "user_permissions",
            "method": "PATCH",
            "path": "/users/:id/permissions/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/permissions/0"
        },
        "DELETE": {
            "table": "user_permissions",
            "method": "DELETE",
            "path": "/users/:id/permissions/:id2",
            "trylink": "http://fbroqua.sytes.net:2000/users/0/permissions/0"
        }
    },
    "users": {
        "GET_ALL": {
            "table": "users",
            "method": "GET_ALL",
            "path": "/users",
            "trylink": "http://fbroqua.sytes.net:2000/users"
        },
        "GET_ONE": {
            "table": "users",
            "method": "GET_ONE",
            "path": "/users/:id",
            "trylink": "http://fbroqua.sytes.net:2000/users/0"
        },
        "POST": {
            "table": "users",
            "method": "POST",
            "path": "/users",
            "trylink": "http://fbroqua.sytes.net:2000/users"
        },
        "PUT": {
            "table": "users",
            "method": "PUT",
            "path": "/users/:id",
            "trylink": "http://fbroqua.sytes.net:2000/users/0"
        },
        "PATCH": {
            "table": "users",
            "method": "PATCH",
            "path": "/users/:id",
            "trylink": "http://fbroqua.sytes.net:2000/users/0"
        },
        "DELETE": {
            "table": "users",
            "method": "DELETE",
            "path": "/users/:id",
            "trylink": "http://fbroqua.sytes.net:2000/users/0"
        }
    }
}

```
