const Course = require('../models/Course');
const User = require('../models/User');
const CommentService = require('../models/Comment');
const { redisClient } = require('../config/redis');
const { driver } = require('../config/neo4j');
const faker = require('faker');
const bcrypt = require('bcryptjs');

async function populateDatabases() {
  let session = null;
  
  try {
    console.log('Iniciando población de bases de datos...');

    // Verificar conexiones
    if (!redisClient.isReady) {
      throw new Error('Redis no está conectado');
    }

    // Limpiar bases de datos
    console.log('Limpiando bases de datos existentes...');
    await Course.deleteMany({});
    await User.deleteMany({});
    await redisClient.flushAll();
    
    session = driver.session();
    await session.run('MATCH (n) DETACH DELETE n');
    
    // Crear datos de cursos
    console.log('Creando cursos...');
    const courses = [];
    
    for (let i = 1; i <= 15; i++) {
      const unitCount = Math.floor(Math.random() * 3) + 2;
      const units = [];
      
      for (let j = 1; j <= unitCount; j++) {
        const lessonCount = Math.floor(Math.random() * 5) + 3;
        const lessons = [];
        
        for (let k = 1; k <= lessonCount; k++) {
          const attachmentCount = Math.floor(Math.random() * 3) + 1;
          const attachments = [];
          
          for (let l = 1; l <= attachmentCount; l++) {
            attachments.push({
              name: `${faker.company.catchPhrase().replace(/['"]/g, '')} ${faker.system.fileExt()}`,
              url: faker.internet.url(),
            });
          }
          
          lessons.push({
            name: faker.company.catchPhrase().replace(/['"]/g, ''),
            order: k,
            videoUrl: `https://www.youtube.com/watch?v=${faker.random.alphaNumeric(11)}`,
            description: faker.lorem.paragraphs(2),
            attachments,
          });
        }
        
        units.push({
          name: `Unidad ${j}: ${faker.company.catchPhrase().replace(/['"]/g, '')}`,
          order: j,
          lessons,
        });
      }

      const courseName = `${faker.company.catchPhrase()} ${faker.company.bsNoun()}`.replace(/['"]/g, '');
      courses.push({
        name: courseName,
        shortDescription: faker.lorem.paragraph(),
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(courseName)}/400/300`,
        bannerUrl: `https://picsum.photos/seed/${encodeURIComponent(courseName)}/1200/400`,
        rating: 0, // Inicializar en 0, se actualizará con los comentarios
        enrolledUsers: Math.floor(Math.random() * 1000) + 100,
        units,
        comments: [] // Inicializar array de comentarios vacío
      });
    }
    
    const createdCourses = await Course.insertMany(courses);
    console.log(`✓ Creados ${createdCourses.length} cursos`);

    // Crear usuarios
    console.log('Creando usuarios...');
    const users = [];
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    for (let i = 1; i <= 50; i++) {
      users.push({
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        name: faker.name.findName(),
        coursesProgress: []
      });
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`✓ Creados ${createdUsers.length} usuarios`);

    // Crear comentarios y progreso
    console.log('Creando comentarios y progreso...');
    const commentPromises = [];
    
    for (const user of createdUsers) {
      const courseCount = Math.floor(Math.random() * 4) + 2;
      const selectedCourses = await Course.aggregate([{ $sample: { size: courseCount } }]);
      
      for (const course of selectedCourses) {
        const progress = Math.floor(Math.random() * 100);
        const status = progress === 100 ? 'COMPLETADO' : 
                      progress > 20 ? 'EN_CURSO' : 'INICIADO';
        
        // Agregar progreso al usuario
        user.coursesProgress.push({
          courseId: course._id,
          status: status,
          progress: progress,
          startDate: faker.date.past(1)
        });

        // Agregar a Redis
        const redisKey = `user:${user._id}:course:${course._id}`;
        await redisClient.hSet(redisKey, {
          status: status,
          progress: progress.toString()
        });

        // Crear comentario si el progreso es suficiente
        if (progress > 30) {
          const rating = Math.floor(Math.random() * 5) + 1;
          commentPromises.push(
            CommentService.createComment(
              user._id.toString(),
              course._id.toString(),
              faker.lorem.paragraph(),
              rating
            )
          );
        }
      }
    }

    // Guardar usuarios actualizados
    await Promise.all(createdUsers.map(user => user.save()));
    
    // Esperar a que se creen todos los comentarios
    await Promise.all(commentPromises);

    // Actualizar ratings de los cursos
    console.log('Actualizando ratings de cursos...');
    for (const course of createdCourses) {
      const courseComments = await CommentService.getCourseComments(course._id.toString());
      if (courseComments.length > 0) {
        const avgRating = courseComments.reduce((sum, comment) => sum + comment.rating, 0) / courseComments.length;
        await Course.findByIdAndUpdate(course._id, { 
          rating: parseFloat(avgRating.toFixed(1))
        });
      }
    }

    console.log('✓ Bases de datos pobladas exitosamente');
    return { success: true, message: 'Bases de datos pobladas exitosamente' };
    
  } catch (error) {
    console.error('Error poblando las bases de datos:', error);
    throw error;
  } finally {
    if (session) {
      await session.close();
    }
  }
}

module.exports = populateDatabases;