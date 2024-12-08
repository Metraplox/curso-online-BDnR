// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisClient } = require('../config/redis');
const auth = require('../middleware/auth');

// Middleware para parsear JSON
router.use(express.json());

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name
    });

    const savedUser = await user.save();
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: savedUser._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { userId: user._id },
      'tu_secreto_jwt',
      { expiresIn: '24h' }
    );

    // Guardar sesión en Redis
    const sessionData = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    };

    await redisClient.set(`session:${user._id}`, JSON.stringify(sessionData));

    res.json({
      token,
      user: sessionData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;