import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create a new Redis client
const client = createClient({ url: redisUrl });

// Log any Redis errors to the console
client.on('error', (error) => {
  console.error('Redis Client Error', error);
});

// Export the Redis client
export default client;