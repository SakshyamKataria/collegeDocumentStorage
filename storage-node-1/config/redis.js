// Redis Connection Configuration
const { createClient } = require('redis');

let publisher;
let subscriber;

const connectRedis = async () => {
  try {
    publisher = createClient({
      url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    subscriber = publisher.duplicate();

    publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

    await publisher.connect();
    await subscriber.connect();

    console.log('✅ Redis Pub/Sub Connected');
    return { publisher, subscriber };
  } catch (error) {
    console.error(`❌ Redis Connection Error: ${error.message}`);
    // Don't exit - Redis is optional for basic functionality
    return { publisher: null, subscriber: null };
  }
};

const getPublisher = () => publisher;
const getSubscriber = () => subscriber;

module.exports = { connectRedis, getPublisher, getSubscriber };
