# Curso Online Backend

Este es un proyecto backend para una plataforma de cursos en línea, desarrollado con Node.js, Express.js, MongoDB, Redis y Neo4j.

## Requisitos

- Node.js (versión 14 o superior)
- MongoDB (versión 4.2 o superior)
- Redis (versión 6.0 o superior)
- Neo4j (versión 4.4 o superior)

## Instalación

1. Clona el repositorio:
git clone https://github.com/tu-usuario/curso-online-backend.git
Copy
2. Instala las dependencias:
cd curso-online-backend
npm install
Copy
3. Configura las variables de entorno:
- Crea un archivo `.env` en la raíz del proyecto.
- Agrega las siguientes variables de entorno:
  - `MONGODB_URI`: URL de conexión a MongoDB (por ejemplo, `mongodb://localhost:27017/curso-online`)
  - `REDIS_URI`: URL de conexión a Redis (por ejemplo, `redis://localhost:6379`)
  - `NEO4J_URI`: URL de conexión a Neo4j (por ejemplo, `bolt://localhost:7687`)
  - `NEO4J_USER`: Usuario de Neo4j
  - `NEO4J_PASSWORD`: Contraseña de Neo4j
  - `PUERTO`: Puerto en el que se ejecutará el servidor (opcional, por defecto es 4000)

4. Inicia el servidor:
npm start
Copy
## Poblar las bases de datos

Para poblar las bases de datos con datos de prueba, envía una solicitud POST a la ruta `/api/populate`:
curl -X POST http://localhost:4000/api/populate
Copy
Esta ruta creará cursos, usuarios, comentarios y progreso en las diferentes bases de datos.

## Documentación de la API

La documentación de los endpoints de la API se encuentra en el código fuente, específicamente en los archivos de rutas (`routes/`). Cada ruta tiene un comentario que describe su funcionalidad, parámetros y respuestas.

## Estructura del proyecto

- `index.js`: Punto de entrada de la aplicación.
- `config/`: Configuración de las conexiones a MongoDB, Redis y Neo4j.
- `middleware/`: Middleware de autenticación.
- `models/`: Definición de los modelos de datos (Mongoose y Neo4j).
- `routes/`: Definición de las rutas de la API.
- `utils/`: Funciones de utilidad, como la de poblar las bases de datos.

## Tecnologías utilizadas

- **Node.js**: Entorno de ejecución de JavaScript.
- **Express.js**: Framework web para Node.js.
- **MongoDB**: Base de datos NoSQL para almacenar cursos, usuarios y progreso.
- **Redis**: Base de datos clave-valor para almacenar sesiones de usuario y progreso.
- **Neo4j**: Base de datos de grafos para almacenar y gestionar los comentarios.
- **Mongoose**: ODM (Object Document Mapping) para interactuar con MongoDB.
- **Bcrypt.js**: Hashing de contraseñas.
- **JWT**: Autenticación mediante tokens.