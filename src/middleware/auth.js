// middleware/auth.js
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'tu_secreto_jwt');
    
    const userSession = await redisClient.get(`session:${decoded.userId}`);
    
    if (!userSession) {
      throw new Error();
    }

    req.user = JSON.parse(userSession);
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Por favor autentícate' });
  }
};

module.exports = auth;