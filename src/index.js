const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { connectRedis } = require('./config/redis');
const { connectNeo4j } = require('./config/neo4j');
const coursesRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const userProgressRoutes = require('./routes/userProgress');
const commentsRoutes = require('./routes/comments');
const populateDatabases = require('./utils/populateDB');

const app = express();
const PORT = process.env.PUERTO || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/courses', coursesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', userProgressRoutes);
app.use('/api/comments', commentsRoutes);
app.post('/api/populate', async (req, res) => {
  try {
    await populateDatabases();
    res.status(200).json({ message: 'Bases de datos pobladas exitosamente' });
  } catch (error) {
    console.error('Error al poblar las bases de datos:', error);
    res.status(500).json({ message: 'Error al poblar las bases de datos' });
  }
});


// Print registered routes
console.log('Registered routes:');
app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/curso-online')
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error de conexión a MongoDB:', err));

connectRedis().catch(console.error);
connectNeo4j().catch(console.error);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});