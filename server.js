import app from './app/index.js';
import { redisClient } from './app/config/redis.js';

const port = process.env.PORT || 8080;

// Initialize services and start server
async function startServer() {
  try {
    // Connect to Redis before starting the server
    await redisClient.connect();
    console.log('✓ Redis connected');
    
    // Start Express server
    app.listen(port, () => {
      console.log(`✓ Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await redisClient.disconnect();
  process.exit(0);
});

startServer();