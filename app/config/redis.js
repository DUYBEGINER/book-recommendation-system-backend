/**
 * Redis Client Configuration
 * Production-ready Redis connection with auto-reconnect and error handling
 */
import { createClient } from 'redis';
import "dotenv/config";
import { logger } from '#utils/logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    this.client = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 19919,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Redis max retries reached');
          }
          return Math.min(retries * 100, 3000); // Exponential backoff, max 3s
        }
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err.message);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis: Connecting...');
    });

    this.client.on('ready', () => {
      logger.info('Redis: Connected and ready');
      this.isConnected = true;
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis: Reconnecting...');
    });

    await this.client.connect();
    return this.client;
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis: Disconnected');
    }
  }
}

// Singleton instance
const redisClient = new RedisClient();

export { redisClient };
