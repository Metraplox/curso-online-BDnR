const { driver } = require('../config/neo4j');

class CommentService {
    async createComment(userId, courseId, content, rating) {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MERGE (u:User {userId: $userId})
                MERGE (c:Course {courseId: $courseId})
                CREATE (u)-[r:COMMENTED {
                    content: $content,
                    rating: $rating,
                    createdAt: datetime()
                }]->(c)
                RETURN r
                `,
                { userId, courseId, content, rating }
            );
            return result.records[0].get('r').properties;
        } finally {
            await session.close();
        }
    }

    async getCourseComments(courseId) {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MATCH (u:User)-[r:COMMENTED]->(c:Course {courseId: $courseId})
                RETURN u.userId as userId, r.content as content, 
                       r.rating as rating, r.createdAt as createdAt
                ORDER BY r.createdAt DESC
                `,
                { courseId }
            );
            return result.records.map(record => ({
                userId: record.get('userId'),
                content: record.get('content'),
                rating: parseInt(record.get('rating')), // Cambiado aquí
                createdAt: record.get('createdAt')
            }));
        } finally {
            await session.close();
        }
    }

    async getUserComments(userId) {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MATCH (u:User {userId: $userId})-[r:COMMENTED]->(c:Course)
                RETURN c.courseId as courseId, r.content as content, 
                       r.rating as rating, r.createdAt as createdAt
                ORDER BY r.createdAt DESC
                `,
                { userId }
            );
            return result.records.map(record => ({
                courseId: record.get('courseId'),
                content: record.get('content'),
                rating: parseInt(record.get('rating')), // Cambiado aquí
                createdAt: record.get('createdAt')
            }));
        } finally {
            await session.close();
        }
    }

    async getCourseRating(courseId) {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MATCH (u:User)-[r:COMMENTED]->(c:Course {courseId: $courseId})
                WITH avg(r.rating) as avgRating, count(r) as totalRatings
                RETURN avgRating, totalRatings
                `,
                { courseId }
            );
            const record = result.records[0];
            return {
                averageRating: parseFloat(record.get('avgRating')),
                totalRatings: parseInt(record.get('totalRatings')) // Cambiado aquí
            };
        } finally {
            await session.close();
        }
    }

    async addReactionToComment(userId, commentId, reactionType) {
        const session = driver.session();
        try {
            await session.run(`
                MATCH (u:User {userId: $userId})
                MATCH (c:Comment {id: $commentId})
                MERGE (u)-[r:REACTED {type: $reactionType}]->(c)
                RETURN r
            `, { userId, commentId, reactionType });
        } finally {
            await session.close();
        }
    }

    async addCommentReply(userId, commentId, content) {
        const session = driver.session();
        try {
            await session.run(`
                MATCH (c:Comment {id: $commentId})
                MATCH (u:User {userId: $userId})
                CREATE (u)-[:REPLIED {content: $content, createdAt: datetime()}]->(c)
            `, { userId, commentId, content });
        } finally {
            await session.close();
        }
    }

    async addLikeToComment(userId, commentId) {
        const session = driver.session();
        try {
            await session.run(`
                MATCH (u:User {userId: $userId})
                MATCH (c:Comment {id: $commentId})
                MERGE (u)-[r:LIKED]->(c)
                RETURN r
            `, { userId, commentId });
        } finally {
            await session.close();
        }
    }
    
    async addDislikeToComment(userId, commentId) {
        const session = driver.session();
        try {
            await session.run(`
                MATCH (u:User {userId: $userId})
                MATCH (c:Comment {id: $commentId})
                MERGE (u)-[r:DISLIKED]->(c)
                RETURN r
            `, { userId, commentId });
        } finally {
            await session.close();
        }
    }

    async addCommentReply(userId, commentId, content) {
        const session = driver.session();
        try {
            await session.run(`
                MATCH (c:Comment {id: $commentId})
                MATCH (u:User {userId: $userId})
                CREATE (u)-[:REPLIED {content: $content, createdAt: datetime()}]->(c)
            `, { userId, commentId, content });
        } finally {
            await session.close();
        }
    }
}

module.exports = new CommentService();