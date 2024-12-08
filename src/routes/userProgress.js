const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const { redisClient } = require('../config/redis');
const { driver } = require('../config/neo4j');

// Obtener todos los cursos del usuario
router.get('/my-courses', auth, async (req, res) => {
   try {
       console.log('Fetching courses for user:', req.user.userId);
       
       const user = await User.findById(req.user.userId)
           .populate('coursesProgress.courseId', 'name shortDescription imageUrl');

       if (!user) {
           return res.status(404).json({ message: 'Usuario no encontrado' });
       }

       // Filtrar solo los cursos que existen y tienen progreso
       const validProgress = user.coursesProgress.filter(p => p.courseId);

       res.json({
           message: 'Cursos recuperados exitosamente',
           courses: validProgress.map(p => ({
               courseId: p.courseId._id,
               name: p.courseId.name,
               shortDescription: p.courseId.shortDescription,
               imageUrl: p.courseId.imageUrl,
               status: p.status,
               progress: p.progress,
               startDate: p.startDate
           }))
       });
   } catch (error) {
       console.error('Error fetching user courses:', error);
       res.status(500).json({ 
           message: 'Error obteniendo los cursos',
           error: error.message 
       });
   }
});

// Ruta original de progreso
router.post('/courses/:courseId/progress', auth, async (req, res) => {
   try {
       const user = await User.findById(req.user.userId);
       if (!user) {
           return res.status(404).json({ message: 'Usuario no encontrado' });
       }

       const course = await Course.findById(req.params.courseId);
       if (!course) {
           return res.status(404).json({ message: 'Curso no encontrado' });
       }

       console.log('Found course and user:', {
           courseId: course._id,
           userId: user._id
       });

       const totalLessons = course.units.reduce((total, unit) => 
           total + unit.lessons.length, 0);

       const progressIndex = user.coursesProgress.findIndex(
           p => p.courseId.toString() === req.params.courseId
       );

       let newProgress = (req.body.completedLessons / totalLessons) * 100;
       let newStatus = newProgress === 100 ? 'COMPLETADO' : 
                      newProgress > 0 ? 'EN_CURSO' : 'INICIADO';

       if (progressIndex === -1) {
           user.coursesProgress.push({
               courseId: req.params.courseId,
               status: newStatus,
               progress: newProgress
           });
       } else {
           user.coursesProgress[progressIndex].progress = newProgress;
           user.coursesProgress[progressIndex].status = newStatus;
       }

       // MongoDB - Guardar progreso
       await user.save();

       // Redis - Actualizar estado
       await redisClient.hSet(
           `user:${user._id}:course:${course._id}`, 
           'status', 
           newStatus
       );

       // Neo4j - Actualizar estado
       const neo4jSession = driver.session();
       try {
           await neo4jSession.run(`
               MERGE (u:User {userId: $userId})
               MERGE (c:Course {courseId: $courseId})
               MERGE (u)-[r:ENROLLED_IN]->(c)
               SET r.status = $status,
                   r.progress = $progress
           `, { 
               userId: user._id.toString(), 
               courseId: course._id.toString(), 
               status: newStatus,
               progress: newProgress
           });
       } finally {
           await neo4jSession.close();
       }

       res.json({
           message: 'Progreso actualizado exitosamente',
           progress: newProgress,
           status: newStatus
       });

   } catch (error) {
       console.error('Error in progress route:', error);
       res.status(500).json({ 
           message: 'Error actualizando el progreso',
           error: error.message 
       });
   }
});

// Ruta de test
router.get('/test', (req, res) => {
   res.json({ message: 'Progress routes working' });
});

module.exports = router;