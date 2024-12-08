const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const { redisClient } = require('../config/redis');
const CommentService = require('../models/Comment');

// Obtener todos los cursos (página principal)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({}, 'name shortDescription imageUrl rating');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener detalle de un curso
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Obtener comentarios de Neo4j
    const comments = await CommentService.getCourseComments(req.params.id);
    
    // Obtener el rating actualizado
    const ratingInfo = await CommentService.getCourseRating(req.params.id);
    
    // Crear una copia del objeto curso para no modificar el original
    const courseWithComments = course.toObject();
    
    // Agregar los comentarios al objeto del curso
    courseWithComments.comments = comments.map(comment => ({
      author: comment.userId,
      content: comment.content,
      rating: comment.rating,
      date: comment.createdAt
    }));

    res.json(courseWithComments);
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    res.status(500).json({ 
      message: 'Error al obtener el curso', 
      error: error.message 
    });
  }
});

// Crear nuevo curso (admin)
router.post('/', async (req, res) => {
  const course = new Course({
    name: req.body.name,
    shortDescription: req.body.shortDescription,
    imageUrl: req.body.imageUrl,
    bannerUrl: req.body.bannerUrl,
    units: req.body.units
  });

  try {
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener cursos con información de progreso del usuario
router.get('/courses', auth, async (req, res) => {
  try {
    const courses = await Course.find({}, 'name description image');
    const userProgress = await redisClient.hGetAll(`user:${req.user.userId}:progress`);
    const coursesWithProgress = courses.map(course => ({
      ...course.toObject(),
      progress: userProgress[course._id] || 0
    }));
    res.json(coursesWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los cursos', error: error.message });
  }
});

module.exports = router;