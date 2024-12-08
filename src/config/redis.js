const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://redis:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  await redisClient.connect();
  console.log('Conectado a Redis');
};

module.exports = { redisClient, connectRedis };