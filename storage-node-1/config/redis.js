// Redis Connection & EventBus Service
const { createClient } = require('redis');

let publisherClient;
let subscriberClient;
let isConnected = false;

const connectRedis = async () => {
  try {
    const redisOptions = {
      url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      socket: {
        reconnectStrategy: (retries) => {
          console.warn(`⚠️ Redis disconnected. Reconnecting... (Attempt ${retries})`);
          // Exponential backoff with max 3s delay
          return Math.min(retries * 100, 3000);
        }
      }
    };

    publisherClient = createClient(redisOptions);
    subscriberClient = publisherClient.duplicate();

    publisherClient.on('error', (err) => console.error('❌ Redis Publisher Error:', err.message));
    subscriberClient.on('error', (err) => console.error('❌ Redis Subscriber Error:', err.message));

    publisherClient.on('connect', () => { isConnected = true; });
    publisherClient.on('end', () => { isConnected = false; });

    await publisherClient.connect();
    await subscriberClient.connect();

    console.log('✅ Redis Pub/Sub Connected (EventBus Ready)');
    return true;
  } catch (error) {
    console.error(`❌ Redis Connection Error: ${error.message}`);
    return false;
  }
};

class EventBus {
  /**
   * Publish an event to a Redis channel
   * @param {string} channel - The channel name
   * @param {Object} data - The payload to send
   */
  static async publish(channel, data) {
    if (!isConnected || !publisherClient) {
      console.warn(`[EventBus] Cannot publish to ${channel} - Redis not connected`);
      return false;
    }
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      await publisherClient.publish(channel, payload);
      return true;
    } catch (error) {
      console.error(`[EventBus] Publish error on ${channel}:`, error.message);
      return false;
    }
  }

  /**
   * Subscribe to a Redis channel
   * @param {string} channel - The channel name
   * @param {Function} callback - Function(data) called when message received
   */
  static async subscribe(channel, callback) {
    if (!isConnected || !subscriberClient) {
      console.warn(`[EventBus] Cannot subscribe to ${channel} - Redis not connected`);
      return false;
    }
    try {
      await subscriberClient.subscribe(channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (e) {
          callback(message); // Fallback to raw message if not JSON
        }
      });
      console.log(`📡 [EventBus] Subscribed to channel: ${channel}`);
      return true;
    } catch (error) {
      console.error(`[EventBus] Subscribe error on ${channel}:`, error.message);
      return false;
    }
  }
  
  static isConnected() {
    return isConnected;
  }
}

module.exports = { connectRedis, EventBus };
