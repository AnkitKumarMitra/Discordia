import Redis from 'ioredis';

let redisClient = null;

const connectRedis = () => {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };

    // Use Redis URL if provided (for cloud services)
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });
    } else {
      redisClient = new Redis(redisConfig);
    }

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      redisClient.disconnect();
      console.log('Redis connection closed through app termination');
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    return null;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = connectRedis();
  }
  return redisClient;
};

export default connectRedis;