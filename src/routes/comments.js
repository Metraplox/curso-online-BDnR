const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CommentService = require('../models/Comment');
const Course = require('../models/Course');
const User = require('../models/User');

// Crear un comentario
router.post('/courses/:courseId/comments', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const course = await Course.findById(req.params.courseId);

        if (!user || !course) {
            return res.status(404).json({ message: 'Usuario o curso no encontrado' });
        }

        const { content, rating } = req.body;
        if (!content || !rating) {
            return res.status(400).json({ message: 'Contenido y puntuación son requeridos' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La puntuación debe estar entre 1 y 5' });
        }

        const comment = await CommentService.createComment(
            req.user.userId.toString(),  // Asegurarse que sea string
            req.params.courseId.toString(),  // Asegurarse que sea string
            content,
            parseInt(rating)  // Asegurarse que sea número
        );

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ 
            message: 'Error al crear el comentario', 
            error: error.message 
        });
    }
});

// Obtener comentarios de un curso
router.get('/courses/:courseId/comments', async (req, res) => {
    try {
        const comments = await CommentService.getCourseComments(req.params.courseId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function updateCourseRating(courseId) {
    try {
        const rating = await CommentService.getCourseRating(courseId);
        await Course.findByIdAndUpdate(courseId, {
            rating: rating.averageRating || 0
        });
    } catch (error) {
        console.error('Error updating course rating:', error);
    }
}

// Obtener comentarios del usuario
router.get('/my/comments', auth, async (req, res) => {
    try {
        const comments = await CommentService.getUserComments(req.user.userId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener rating de un curso
router.get('/courses/:courseId/rating', async (req, res) => {
    try {
        const rating = await CommentService.getCourseRating(req.params.courseId);
        res.json(rating);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Agregar reacción a un comentario
router.post('/comments/:commentId/reactions', auth, async (req, res) => {
    try {
        const { reactionType } = req.body;
        await CommentService.addReactionToComment(
            req.user.userId,
            req.params.commentId,
            reactionType
        );
        res.status(201).json({ message: 'Reacción agregada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Agregar respuesta a un comentario
router.post('/comments/:commentId/replies', auth, async (req, res) => {
    try {
        const { content } = req.body;
        await CommentService.addCommentReply(req.user.userId, req.params.commentId, content);
        res.status(201).json({ message: 'Respuesta agregada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Agregar like a un comentario
router.post('/comments/:commentId/like', auth, async (req, res) => {
    try {
        await CommentService.addLikeToComment(req.user.userId, req.params.commentId);
        res.status(201).json({ message: 'Like agregado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Agregar dislike a un comentario
router.post('/comments/:commentId/dislike', auth, async (req, res) => {
    try {
        await CommentService.addDislikeToComment(req.user.userId, req.params.commentId);
        res.status(201).json({ message: 'Dislike agregado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;